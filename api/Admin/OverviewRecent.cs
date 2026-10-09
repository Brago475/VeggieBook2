using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The Recent activity list on the admin Overview, newest first, by research
// ID only. Four kinds of line:
//
//   book             a book saved          (from book_session)
//   joined           a new account         (from app_user)
//   book_deleted     a book deleted        (from activity_log)
//   account_deleted  an account deleted    (from activity_log)
//
// Deletions come from the activity log (db/migrations/007_activity_log.sql).
// If that table doesn't exist yet, the list simply has no deletions.

public static class OverviewRecent
{
    private record Line(string Type, string ResearchId, string Title, string Detail, DateTime At);

    public static async Task<List<object>> BuildAsync(
        AccountsContext db,
        IQueryable<AppUser> people,
        IQueryable<Book> books,
        Dictionary<string, string> vegetableNames,
        Dictionary<int, string> categoryNames,
        int count)
    {
        var ids = await ParticipantIds.EnsureAsync(db);

        var saved = await books
            .OrderByDescending(b => b.CreatedAt)
            .Take(count)
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

        var joined = await people
            .OrderByDescending(u => u.CreatedAt)
            .Take(count)
            .Select(u => new { u.Id, u.CreatedAt, u.AgeRange })
            .ToListAsync();

        List<ActivityEntry> logged;
        try
        {
            logged = await db.ActivityLog
                .AsNoTracking()
                .OrderByDescending(a => a.At)
                .Take(count)
                .ToListAsync();
        }
        catch (Exception)
        {
            // The activity_log table hasn't been created yet.
            logged = [];
        }

        string Name(string kind, string? vegetableCode, int? categoryId) => kind == "secrets"
            ? (categoryId is int id ? categoryNames.GetValueOrDefault(id, "") : "")
            : (vegetableCode is string code ? vegetableNames.GetValueOrDefault(code, code) : "");

        var lines = saved
            .Select(b => new Line(
                "book",
                ids.GetValueOrDefault(b.UserId, ""),
                BookTitle("Saved", Name(b.Kind, b.VegetableCode, b.SecretCategoryId), b.Kind),
                Items(b.Kept, b.Kind) + " kept",
                b.CreatedAt))
            .Concat(joined.Select(u => new Line(
                "joined",
                ids.GetValueOrDefault(u.Id, ""),
                "Joined",
                string.IsNullOrEmpty(u.AgeRange) ? "No age range given" : $"Age {u.AgeRange}",
                u.CreatedAt)))
            .Concat(logged.Select(a => a.Kind == "account_deleted"
                ? new Line(
                    "account_deleted",
                    a.ParticipantId,
                    "Deleted their account",
                    "Account and all books removed",
                    a.At)
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

    // "Saved a Cabbage VeggieBook", "Deleted a Breakfast Secrets Book". A
    // category that already ends in "Secrets" (such as "Shopping Secrets")
    // becomes "Saved a Shopping Secrets Book" instead of repeating the word.
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