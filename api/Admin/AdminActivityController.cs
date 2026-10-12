using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Admin;

/// <summary>
/// Full activity history for the admin Activity page, newest first.
///
///   GET /api/admin/activity?study={number}
///
/// Event types: book_saved, joined, book_deleted, account_deleted,
/// tracking_on, tracking_off, study_started, study_ended, study_renamed,
/// study_deleted, notice_joined, notice_declined. Nothing is pruned; every
/// source table is permanent.
///
/// Each participant event is shown only if tracking was on at the moment it
/// happened (ResearchScope.CountsBook): later tracking changes never hide or
/// reveal past events. Saves come from the book table, plus book_saved log
/// lines for books deleted since (matched on research ID and saved time).
/// Admin and guest accounts never appear. study limits events to that
/// study's window.
/// </summary>
[ApiController]
[Route("api/admin/activity")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminActivityController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private record Event(string Type, string? ResearchId, string Title, string Detail, DateTime At);

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? study)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null)
            return NotFound(new { error = $"There is no Study {study}. It may have been deleted." });

        var ids = await ParticipantIds.EnsureAsync(db);
        var userOf = ids.ToDictionary(kv => kv.Value, kv => kv.Key);
        var scope = await ResearchScope.LoadAsync(db);
        var people = await StudyTracking.PeopleAsync(db);

        var vegetableNames = await content.Vegetables.AsNoTracking().ToDictionaryAsync(v => v.Code, v => v.NameEn);
        var categoryNames = await content.SecretCategories.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.NameEn);

        string Name(string kind, string? vegetableCode, int? categoryId) => kind == "secrets"
            ? (categoryId is int id ? categoryNames.GetValueOrDefault(id, "") : "")
            : (vegetableCode is string code ? vegetableNames.GetValueOrDefault(code, code) : "");

        var events = new List<Event>();

        // Saved books still in the database.
        var books = (await db.Books
                .AsNoTracking()
                .Where(b => people.Any(u => u.Id == b.UserId))
                .Select(b => new
                {
                    b.UserId,
                    b.Kind,
                    b.VegetableCode,
                    b.SecretCategoryId,
                    b.CreatedAt,
                    Kept = b.Selections.Count(s => s.Kept)
                })
                .ToListAsync())
            .Where(b => scope.CountsBook(b.UserId, b.CreatedAt))
            .ToList();

        var existing = books
            .Select(b => (ids.GetValueOrDefault(b.UserId, ""), b.CreatedAt))
            .ToHashSet();

        events.AddRange(books.Select(b => new Event(
            "book_saved",
            ids.GetValueOrDefault(b.UserId),
            BookTitle("Saved", Name(b.Kind, b.VegetableCode, b.SecretCategoryId), b.Kind),
            Items(b.Kept, b.Kind) + " kept",
            b.CreatedAt)));

        // New participants, by tracking state at the moment they joined.
        var joined = (await people.Select(u => new { u.Id, u.CreatedAt, u.AgeRange }).ToListAsync())
            .Where(u => scope.CountsBook(u.Id, u.CreatedAt));
        events.AddRange(joined.Select(u => new Event(
            "joined",
            ids.GetValueOrDefault(u.Id),
            "Joined",
            string.IsNullOrEmpty(u.AgeRange) ? "No age range given" : $"Age {u.AgeRange}",
            u.CreatedAt)));

        // Activity log: deletions, admin study actions, and saves of books deleted since.
        var logged = await db.ActivityLog.AsNoTracking().ToListAsync();

        bool OwnerTracked(ActivityEntry a, DateTime at) =>
            !userOf.TryGetValue(a.ParticipantId, out var owner) || scope.CountsBook(owner, at);

        foreach (var a in logged)
        {
            var kind = a.BookKind ?? "veggie";
            var name = Name(kind, a.VegetableCode, a.SecretCategoryId);

            if (a.Kind == ActivityLog.StudyRenamed)
            {
                events.Add(new Event("study_renamed", null, $"Renamed Study {a.ItemCount}", a.Detail ?? "", a.At));
            }
            else if (a.Kind == ActivityLog.StudyDeleted)
            {
                events.Add(new Event("study_deleted", null, $"Deleted Study {a.ItemCount}", a.Detail ?? "", a.At));
            }
            else if (a.Kind == ActivityLog.AccountDeleted)
            {
                events.Add(new Event("account_deleted", a.ParticipantId, "Deleted their account",
                    "Account and all books removed", a.At));
            }
            else if (a.Kind == ActivityLog.BookDeleted && OwnerTracked(a, a.At))
            {
                events.Add(new Event("book_deleted", a.ParticipantId, BookTitle("Deleted", name, kind),
                    a.ItemCount is int n ? "Had " + Items(n, kind) : "Book removed", a.At));
            }
            else if (a.Kind == ActivityLog.BookSaved && !existing.Contains((a.ParticipantId, a.At)) && OwnerTracked(a, a.At))
            {
                events.Add(new Event("book_saved", a.ParticipantId, BookTitle("Saved", name, kind),
                    (a.ItemCount is int n ? Items(n, kind) + " kept" : "Book saved") + ", deleted later", a.At));
            }
        }

        // Tracking changes.
        var peopleIds = await people.Select(u => u.Id).ToListAsync();
        var changes = await db.TrackingChanges.AsNoTracking().Where(c => peopleIds.Contains(c.UserId)).ToListAsync();
        events.AddRange(changes.Select(c => new Event(
            c.TrackingOn ? "tracking_on" : "tracking_off",
            ids.GetValueOrDefault(c.UserId),
            c.ChangedBy == "admin"
                ? (c.TrackingOn ? "Tracking turned back on by an admin" : "Tracking turned off by an admin")
                : (c.TrackingOn ? "Turned tracking on" : "Turned tracking off"),
            c.ChangedBy == "admin" ? "Admin action" : "In Settings, by the participant",
            c.At)));

        // Studies.
        var studies = await db.Studies.AsNoTracking().ToListAsync();
        foreach (var s in studies)
        {
            var title = $"{StudyData.TitleOf(s)}" + (string.IsNullOrWhiteSpace(s.Name) ? "" : $" (Study {s.Number})");
            events.Add(new Event("study_started", null, $"Started {title}", "Switched on by an admin", s.StartedAt));
            if (s.EndedAt is DateTime ended)
                events.Add(new Event("study_ended", null, $"Ended {title}", "Switched off by an admin", ended));
        }

        // Study notice answers.
        var studyTitle = studies.ToDictionary(s => s.Id, s => StudyData.TitleOf(s));
        var notices = await db.StudyNotices.AsNoTracking()
            .Where(n => n.AnsweredAt != null && peopleIds.Contains(n.UserId))
            .ToListAsync();
        events.AddRange(notices.Select(n => new Event(
            n.Answer == "joined" ? "notice_joined" : "notice_declined",
            ids.GetValueOrDefault(n.UserId),
            n.Answer == "joined"
                ? $"Joined {studyTitle.GetValueOrDefault(n.StudyId, "a study")} from the notice"
                : $"Chose not now for {studyTitle.GetValueOrDefault(n.StudyId, "a study")}",
            "Study notice answered",
            n.AnsweredAt!.Value)));

        var result = events
            .Where(e => window is null || (e.At >= window.StartedAt && (window.EndedAt is null || e.At <= window.EndedAt)))
            .OrderByDescending(e => e.At)
            .Select(e => new
            {
                type = e.Type,
                researchId = e.ResearchId,
                title = e.Title,
                detail = e.Detail,
                at = DateTime.SpecifyKind(e.At, DateTimeKind.Utc)
            })
            .ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(new { events = result });
    }

    private static string BookTitle(string verb, string name, string kind)
    {
        var type = kind == "secrets" ? "Secrets Book" : "VeggieBook";
        if (string.IsNullOrWhiteSpace(name)) return $"{verb} a {type}";
        if (kind == "secrets" && name.EndsWith("Secrets", StringComparison.OrdinalIgnoreCase))
            return $"{verb} a {name} Book";
        return $"{verb} a {name} {type}";
    }

    private static string Items(int n, string kind)
    {
        var word = kind == "secrets" ? "secret" : "recipe";
        return n == 1 ? $"1 {word}" : $"{n} {word}s";
    }
}