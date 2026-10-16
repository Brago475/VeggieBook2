using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The Recent activity list on the admin Overview, newest first, by research ID only:
//
//   book             a book saved          (from book_session)
//   joined           a new account         (from app_user)
//   book_deleted     a book deleted        (from activity_log)
//   account_deleted  an account deleted    (from activity_log)
//
// Only book_deleted and account_deleted lines are read from the log; saves
// come from the book table so they are never listed twice.
//
// People who opted out are not tracked (Research/ResearchScope.cs). A deleted
// account has no tracking left to check, so it is always listed.

public static class OverviewRecent
{
    private const int Overfetch = 4;

    private record Line(string Type, string ResearchId, string Title, string Detail, DateTime At);

    public static async Task<List<object>> BuildAsync(
        AccountsContext db,
        IQueryable<AppUser> people,
        IQueryable<Book> books,
        ResearchScope scope,
        Dictionary<string, string> vegetableNames,
        Dictionary<int, string> categoryNames,
        int count)
    {
        var ids = await ParticipantIds.EnsureAsync(db);
        var userOf = ids.ToDictionary(kv => kv.Value, kv => kv.Key);

        // More than needed is read, since some lines are left out.
        var read = count * Overfetch;

        var saved = (await books
                .OrderByDescending(b => b.CreatedAt)
                .Take(read)
                .Select(b => new
                {
                    b.UserId,
                    b.Kind,
                    b.VegetableCode,
                    b.SecretCategoryId,
                    b.CreatedAt,
                    KeptAtSave = b.Selections.Count(s => !s.DroppedInReview),
                    Dropped = b.Selections.Count(s => s.DroppedInReview)
                })
                .ToListAsync())
            .Where(b => scope.CountsBook(b.UserId, b.CreatedAt))
            .ToList();

        var joined = (await people
                .OrderByDescending(u => u.CreatedAt)
                .Take(read)
                .Select(u => new { u.Id, u.CreatedAt, u.AgeRange })
                .ToListAsync())
            .Where(u => scope.CountsPerson(u.Id))
            .ToList();

        List<ActivityEntry> logged;
        try
        {
            logged = await db.ActivityLog
                .AsNoTracking()
                .Where(a => a.Kind == ActivityLog.BookDeleted || a.Kind == ActivityLog.AccountDeleted)
                .OrderByDescending(a => a.At)
                .Take(read)
                .ToListAsync();
        }
        catch (Exception)
        {
            // The activity_log table hasn't been created yet.
            logged = [];
        }

        // A deleted book counts only while its owner's tracking is on.
        bool Shows(ActivityEntry a) =>
            a.Kind == ActivityLog.AccountDeleted
            || string.IsNullOrEmpty(a.ParticipantId)
            || !userOf.TryGetValue(a.ParticipantId, out var owner)
            || scope.CountsPerson(owner);

        string Name(string kind, string? vegetableCode, int? categoryId) => kind == "secrets"
            ? (categoryId is int id ? categoryNames.GetValueOrDefault(id, "") : "")
            : (vegetableCode is string code ? vegetableNames.GetValueOrDefault(code, code) : "");

        Line AccountLine(ActivityEntry a) => ActivityLog.IsRemovedByAdmin(a)
            ? new Line("account_deleted", a.ParticipantId, "Account removed by an admin",
                "Admin action, all books removed", a.At)
            : new Line("account_deleted", a.ParticipantId, "Deleted their account",
                "Account and all books removed", a.At);

        var lines = saved
            .Select(b => new Line(
                "book",
                ids.GetValueOrDefault(b.UserId, ""),
                BookTitle("Saved", Name(b.Kind, b.VegetableCode, b.SecretCategoryId), b.Kind),
                Items(b.KeptAtSave, b.Kind) + " kept" + (b.Dropped > 0 ? $", {b.Dropped} taken out" : ""),
                b.CreatedAt))
            .Concat(joined.Select(u => new Line(
                "joined",
                ids.GetValueOrDefault(u.Id, ""),
                "Joined",
                string.IsNullOrEmpty(u.AgeRange) ? "No age range given" : $"Age {u.AgeRange}",
                u.CreatedAt)))
            .Concat(logged.Where(Shows).Select(a => a.Kind == ActivityLog.AccountDeleted
                ? AccountLine(a)
                : new Line(
                    "book_deleted",
                    a.ParticipantId,
                    BookTitle("Deleted", Name(a.BookKind ?? "veggie", a.VegetableCode, a.SecretCategoryId), a.BookKind ?? "veggie"),
                    a.ItemCount is int n ? "Had " + Items(n, a.BookKind ?? "veggie") : "Book removed",
                    a.At)))
            .Where(l => l.ResearchId != "")
            .OrderByDescending(l => l.At)
            .Take(count)
            .Select(l => (object)new
            {
                type = l.Type,
                researchId = l.ResearchId,
                title = l.Title,
                detail = l.Detail,
                at = DateTime.SpecifyKind(l.At, DateTimeKind.Utc)
            })
            .ToList();

        return lines;
    }

    // "Saved a Cabbage VeggieBook", "Saved a Shopping Secrets Book".
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