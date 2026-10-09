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
// Admins only (Roles.AdminPolicy).
//
// Who counts: "participants" are real accounts that are not admins, the
// same people the research sheets use. Guests are temporary and admin books
// are tests, so both are left out of every number here except the two that
// are about the site itself (locked password resets and guests right now).
//
// What it returns:
//   counts       participants, new this week, books, answers recorded
//   weekly       books saved per week for the last 8 weeks, Monday to
//                Sunday in Eastern time
//   topAnswers   the 5 answers the most people picked, from the Most chosen
//                tally (Research/ChoiceTally.cs), so the numbers match
//   recent       the latest books saved and accounts joined, by research ID
//                only; no email or name is read
//
// "Answers recorded" counts answers on the questions that people see; the
// hidden questions the original app filled in by itself are not counted.

[ApiController]
[Route("api/admin/overview")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminOverviewController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private const int Weeks = 8;
    private const int RecentCount = 8;

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

        // Counts

        var participants = await people.CountAsync();
        var newThisWeek = await people.CountAsync(u => u.CreatedAt >= weekAgo);
        var veggieBooks = await books.CountAsync(b => b.Kind == "veggie");
        var secretsBooks = await books.CountAsync(b => b.Kind == "secrets");
        var recoveryLocked = await realAccounts.CountAsync(u => u.RecoveryLockedAt != null);
        var activeGuests = await db.Users.AsNoTracking()
            .CountAsync(u => u.GuestExpiresAt != null && u.GuestExpiresAt > now);

        // Books per week, Eastern weeks starting Monday

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(now, zone));
        var thisMonday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var firstMonday = thisMonday.AddDays(-7 * (Weeks - 1));
        var fromUtc = TimeZoneInfo.ConvertTimeToUtc(firstMonday.ToDateTime(TimeOnly.MinValue), zone);

        var recentBooks = await books
            .Where(b => b.CreatedAt >= fromUtc)
            .Select(b => new { b.CreatedAt, b.Kind })
            .ToListAsync();

        var byWeek = recentBooks
            .Select(b => new
            {
                Week = (DateOnly.FromDateTime(ToZone(b.CreatedAt, zone)).DayNumber - firstMonday.DayNumber) / 7,
                b.Kind
            })
            .Where(b => b.Week >= 0 && b.Week < Weeks)
            .ToList();

        var weekly = Enumerable.Range(0, Weeks)
            .Select(i => new
            {
                weekStart = firstMonday.AddDays(7 * i).ToString("yyyy-MM-dd"),
                veggie = byWeek.Count(b => b.Week == i && b.Kind == "veggie"),
                secrets = byWeek.Count(b => b.Week == i && b.Kind == "secrets")
            })
            .ToList();

        // Top answers, from the same tally as the Most chosen sheet

        var tally = await ChoiceTally.BuildAsync(db, content, new SheetFilter(null, null, null, null));
        var answersRecorded = tally.Rows.Sum(r => Convert.ToInt32(r["books"]));

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

        // Recent activity, by research ID only

        var ids = await ParticipantIds.EnsureAsync(db);

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .ToDictionaryAsync(v => v.Code, v => v.NameEn);
        var categories = await content.SecretCategories
            .AsNoTracking()
            .ToDictionaryAsync(c => c.Id, c => c.NameEn);

        var latestBooks = await books
            .OrderByDescending(b => b.CreatedAt)
            .Take(RecentCount)
            .Select(b => new
            {
                b.UserId,
                b.Kind,
                b.VegetableCode,
                b.SecretCategoryId,
                b.CreatedAt,
                Kept = b.Selections.Count(s => s.Kept)
            })
            .ToListAsync();

        var latestJoins = await people
            .OrderByDescending(u => u.CreatedAt)
            .Take(RecentCount)
            .Select(u => new { u.Id, u.CreatedAt, u.AgeRange })
            .ToListAsync();

        var recent = latestBooks
            .Select(b =>
            {
                var isSecrets = b.Kind == "secrets";
                var name = isSecrets
                    ? (b.SecretCategoryId is int id ? categories.GetValueOrDefault(id, "a") : "a")
                    : (b.VegetableCode is string code ? vegetables.GetValueOrDefault(code, code) : "a");
                return new RecentItem(
                    "book",
                    ids.GetValueOrDefault(b.UserId, ""),
                    isSecrets ? $"Saved a {name} Secrets Book" : $"Saved a {name} VeggieBook",
                    isSecrets ? Plural(b.Kept, "secret") + " kept" : Plural(b.Kept, "recipe") + " kept",
                    b.CreatedAt);
            })
            .Concat(latestJoins.Select(u => new RecentItem(
                "joined",
                ids.GetValueOrDefault(u.Id, ""),
                "Joined",
                string.IsNullOrEmpty(u.AgeRange) ? "No age range given" : $"Age {u.AgeRange}",
                u.CreatedAt)))
            .Where(r => r.ResearchId != "")
            .OrderByDescending(r => r.At)
            .Take(RecentCount)
            .Select(r => new
            {
                type = r.Type,
                researchId = r.ResearchId,
                title = r.Title,
                detail = r.Detail,
                at = DateTime.SpecifyKind(r.At, DateTimeKind.Utc)
            })
            .ToList();

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            participants,
            newThisWeek,
            veggieBooks,
            secretsBooks,
            answersRecorded,
            recoveryLocked,
            activeGuests,
            weekly,
            topAnswers,
            recent
        });
    }

    private record RecentItem(string Type, string ResearchId, string Title, string Detail, DateTime At);

    private static string Plural(int n, string word) => n == 1 ? $"1 {word}" : $"{n} {word}s";

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