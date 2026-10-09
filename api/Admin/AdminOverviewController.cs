using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// Everything on the admin Overview page, in one call.
//
//   GET /api/admin/overview
//
// Admins only (Roles.AdminPolicy). The page calls this again every minute.
//
// Who counts: "participants" are real accounts that are not admins, the
// same people the research sheets use. Guests are temporary and admin books
// are tests, so both are left out of every number here except the two that
// are about the site itself (locked password resets and guests right now).
//
// What it returns:
//   counts         participants, new in the last 7 days, books, answers
//   weekly         books saved per week, last 8 weeks (Monday to Sunday,
//                  Eastern time); joinedWeekly and answersWeekly the same
//                  way, for the trend lines on the cards
//   byVegetable    VeggieBooks per vegetable, every active vegetable
//   byCategory     Secrets Books per category
//   ageRanges      participants per age range
//   languages,     book counts for the three rings
//   covers
//   items          recipes and secrets kept, and taken out later
//   heat           books saved by day of week (Monday first) and 3-hour
//                  block of the day (midnight first), Eastern time
//   topAnswers     the 5 answers the most people picked, from the Most
//                  chosen tally (Research/ChoiceTally.cs), so they match
//   recent         latest saves, joins, and deletions, by research ID only
//                  (OverviewRecent.cs)
//
// "Answers" counts answers on the questions that people see; the hidden
// questions the original app filled in by itself are not counted.

[ApiController]
[Route("api/admin/overview")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminOverviewController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private const int Weeks = 8;
    private const int RecentCount = 8;
    private const int Blocks = 8; // 3-hour blocks in a day

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);
        var zone = Eastern();

        var adminRoleId = await db.Roles
            .Where(r => r.Name == Roles.Admin)
            .Select(r => r.Id)
            .FirstAsync();

        var realAccounts = db.Users.AsNoTracking().Where(u => u.GuestExpiresAt == null);
        var people = realAccounts
            .Where(u => !db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == adminRoleId));
        var books = db.Books.AsNoTracking()
            .Where(b => people.Any(u => u.Id == b.UserId));

        // Load what the charts need. The study has hundreds of people at
        // most, so this is small enough to work on in memory.

        var joins = await people
            .Select(u => new { u.CreatedAt, u.AgeRange })
            .ToListAsync();

        var allBooks = await books
            .Select(b => new
            {
                b.Kind,
                b.Language,
                b.VegetableCode,
                b.SecretCategoryId,
                Personal = b.CoverUpload != null,
                b.CreatedAt
            })
            .ToListAsync();

        var recoveryLocked = await realAccounts.CountAsync(u => u.RecoveryLockedAt != null);
        var activeGuests = await db.Users.AsNoTracking()
            .CountAsync(u => u.GuestExpiresAt != null && u.GuestExpiresAt > now);

        // Weeks: Eastern, starting Monday, the last one being this week.

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(now, zone));
        var thisMonday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var firstMonday = thisMonday.AddDays(-7 * (Weeks - 1));

        int WeekOf(DateOnly day)
        {
            var diff = day.DayNumber - firstMonday.DayNumber;
            return diff < 0 ? -1 : diff / 7;
        }

        int WeekOfUtc(DateTime utc) => WeekOf(DateOnly.FromDateTime(ToZone(utc, zone)));

        var weekly = Enumerable.Range(0, Weeks)
            .Select(i => new
            {
                weekStart = firstMonday.AddDays(7 * i).ToString("yyyy-MM-dd"),
                veggie = allBooks.Count(b => b.Kind == "veggie" && WeekOfUtc(b.CreatedAt) == i),
                secrets = allBooks.Count(b => b.Kind == "secrets" && WeekOfUtc(b.CreatedAt) == i)
            })
            .ToList();

        var joinedWeekly = new int[Weeks];
        foreach (var j in joins)
        {
            var w = WeekOfUtc(j.CreatedAt);
            if (w >= 0 && w < Weeks) joinedWeekly[w]++;
        }

        // Answers, from the Responses sheet so they match the research data.

        var responses = await ResearchSheets.ResponsesAsync(db, content, new SheetFilter(null, null, null, null));
        var answersRecorded = 0;
        var answersWeekly = new int[Weeks];
        foreach (var row in responses.Rows)
        {
            var n = Convert.ToInt32(row.GetValueOrDefault("answers") ?? 0);
            answersRecorded += n;
            if (row.GetValueOrDefault("date") is string date && DateOnly.TryParse(date, out var day))
            {
                var w = WeekOf(day);
                if (w >= 0 && w < Weeks) answersWeekly[w] += n;
            }
        }

        // Books by vegetable and by Secrets category

        var vegetableNames = await content.Vegetables
            .AsNoTracking()
            .ToDictionaryAsync(v => v.Code, v => v.NameEn);

        var activeVegetables = await content.Vegetables
            .AsNoTracking()
            .Where(v => v.Active)
            .OrderBy(v => v.SortOrder)
            .Select(v => new { v.Code, v.NameEn })
            .ToListAsync();

        var byVegetable = activeVegetables
            .Select(v => new
            {
                name = v.NameEn,
                count = allBooks.Count(b => b.Kind == "veggie" && b.VegetableCode == v.Code)
            })
            .OrderByDescending(v => v.count)
            .ThenBy(v => v.name)
            .ToList();

        var categoryNames = await content.SecretCategories
            .AsNoTracking()
            .ToDictionaryAsync(c => c.Id, c => c.NameEn);

        var byCategory = categoryNames
            .Select(c => new
            {
                name = c.Value,
                count = allBooks.Count(b => b.Kind == "secrets" && b.SecretCategoryId == c.Key)
            })
            .OrderByDescending(c => c.count)
            .ThenBy(c => c.name)
            .ToList();

        // Participants by age range; no age range given goes last.

        var ageRanges = joins
            .GroupBy(j => string.IsNullOrEmpty(j.AgeRange) ? null : j.AgeRange)
            .Select(g => new { name = g.Key ?? "Not given", count = g.Count(), missing = g.Key is null })
            .OrderBy(a => a.missing)
            .ThenBy(a => a.name)
            .Select(a => new { a.name, a.count })
            .ToList();

        // Rings

        var languages = new
        {
            english = allBooks.Count(b => b.Language != "es"),
            spanish = allBooks.Count(b => b.Language == "es")
        };

        var covers = new
        {
            builtin = allBooks.Count(b => !b.Personal),
            personal = allBooks.Count(b => b.Personal)
        };

        // Kept and taken out later, per kind of item

        var itemGroups = await books
            .SelectMany(b => b.Selections)
            .GroupBy(s => new { s.ContentType, s.Kept })
            .Select(g => new { g.Key.ContentType, g.Key.Kept, Count = g.Count() })
            .ToListAsync();

        int Items(string type, bool kept) =>
            itemGroups.Where(g => g.ContentType == type && g.Kept == kept).Sum(g => g.Count);

        var items = new
        {
            recipesKept = Items("recipe", true),
            recipesRemoved = Items("recipe", false),
            secretsKept = Items("secret", true),
            secretsRemoved = Items("secret", false)
        };

        // When books are saved: day of week (Monday first) by 3-hour block

        var heat = new int[7][];
        for (var d = 0; d < 7; d++) heat[d] = new int[Blocks];
        foreach (var b in allBooks)
        {
            var local = ToZone(b.CreatedAt, zone);
            var day = ((int)local.DayOfWeek + 6) % 7;
            heat[day][local.Hour / 3]++;
        }

        // Top answers, from the same tally as the Most chosen sheet

        var tally = await ChoiceTally.BuildAsync(db, content, new SheetFilter(null, null, null, null));

        var topAnswers = tally.Rows
            .Where(r => Convert.ToInt32(r["people"]) > 0)
            .OrderByDescending(r => Convert.ToInt32(r["people"]))
            .ThenByDescending(r => Convert.ToInt32(r["books"]))
            .Take(5)
            .Select(r => new
            {
                answer = r["answer"] as string ?? "",
                question = r["question_no"] as string ?? "",
                people = Convert.ToInt32(r["people"]),
                percent = Convert.ToDouble(r["people_pct"])
            })
            .ToList();

        // Recent activity: saves, joins, and deletions

        var recent = await OverviewRecent.BuildAsync(
            db, people, books, vegetableNames, categoryNames, RecentCount);

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            participants = joins.Count,
            newThisWeek = joins.Count(j => j.CreatedAt >= weekAgo),
            veggieBooks = allBooks.Count(b => b.Kind == "veggie"),
            secretsBooks = allBooks.Count(b => b.Kind == "secrets"),
            answersRecorded,
            recoveryLocked,
            activeGuests,
            weekly,
            joinedWeekly,
            answersWeekly,
            byVegetable,
            byCategory,
            ageRanges,
            languages,
            covers,
            items,
            heat,
            topAnswers,
            recent
        });
    }

    private static DateTime ToZone(DateTime utc, TimeZoneInfo zone) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), zone);

    // Eastern time (Kean is in New Jersey). Falls back to UTC if the server
    // can't find the zone, the same as the research sheets.
    private static TimeZoneInfo Eastern()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}