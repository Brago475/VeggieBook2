using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// Builds the research sheets. Every row is keyed by the anonymous research
// ID; no email, name, username, or account ID is read here.
//
//   Participants  one row per person
//   Responses     one row per saved book
//
// Who is included: real accounts that are not admins. Guests are temporary
// and admin books are tests, so both are left out.
//
// Dates and times are shown in Eastern time (Kean is in New Jersey). If the
// server can't find that time zone, they fall back to UTC and the column
// labels say so.
//
// Hidden questions are left out: the original app set them itself and
// never showed them, so no one answers them.

public static class ResearchSheets
{
    private static readonly (TimeZoneInfo Zone, string Name) Local = FindZone();

    private static (TimeZoneInfo, string) FindZone()
    {
        try
        {
            return (TimeZoneInfo.FindSystemTimeZoneById("America/New_York"), "Eastern");
        }
        catch (TimeZoneNotFoundException)
        {
            return (TimeZoneInfo.Utc, "UTC");
        }
    }

    private static DateTime ToLocal(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Local.Zone);

    private record Person(Guid UserId, string ParticipantId, DateTime CreatedAt, string? AgeRange);

    // Real, non-admin accounts with their research IDs, giving IDs to any
    // that don't have one yet.
    private static async Task<Dictionary<Guid, Person>> LoadPeopleAsync(AccountsContext db)
    {
        var ids = await ParticipantIds.EnsureAsync(db);

        var adminRoleId = await db.Roles
            .Where(r => r.Name == Roles.Admin)
            .Select(r => r.Id)
            .FirstAsync();

        var users = await db.Users
            .AsNoTracking()
            .Where(u => u.GuestExpiresAt == null
                     && !db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == adminRoleId))
            .Select(u => new { u.Id, u.CreatedAt, u.AgeRange })
            .ToListAsync();

        return users
            .Where(u => ids.ContainsKey(u.Id))
            .ToDictionary(
                u => u.Id,
                u => new Person(
                    u.Id,
                    ids[u.Id],
                    u.CreatedAt,
                    string.IsNullOrEmpty(u.AgeRange) ? null : u.AgeRange));
    }

    // ---- Participants: one row per person ----

    public static async Task<Sheet> ParticipantsAsync(AccountsContext db, SheetFilter filter)
    {
        var people = await LoadPeopleAsync(db);
        var userIds = people.Keys.ToList();

        var books = (await db.Books
                .AsNoTracking()
                .Where(b => userIds.Contains(b.UserId))
                .Select(b => new
                {
                    b.UserId,
                    b.Kind,
                    b.CreatedAt,
                    Selections = b.Selections.Select(s => new { s.ContentType, s.Kept }).ToList()
                })
                .ToListAsync())
            .ToLookup(b => b.UserId);

        var ageValues = people.Values
            .Select(p => p.AgeRange)
            .OfType<string>()
            .Distinct()
            .Order()
            .ToList();

        var columns = new List<SheetColumn>
        {
            new("participant_id", "Participant ID", "text"),
            new("age_range", "Age range", "text", ageValues),
            new("joined_month", "Month joined", "text"),
            new("books", "Books saved", "number"),
            new("veggie_books", "VeggieBooks", "number"),
            new("secrets_books", "Secrets Books", "number"),
            new("recipes_kept", "Recipes kept", "number"),
            new("recipes_removed", "Recipes taken out later", "number"),
            new("secrets_kept", "Secrets kept", "number"),
            new("secrets_removed", "Secrets taken out later", "number"),
            new("first_book_date", $"First book ({Local.Name})", "date"),
            new("last_book_date", $"Latest book ({Local.Name})", "date")
        };

        var rows = people.Values
            .Where(p => filter.AgeRange is null || p.AgeRange == filter.AgeRange)
            .OrderBy(p => p.ParticipantId)
            .Select(p =>
            {
                var own = books[p.UserId].ToList();
                var sel = own.SelectMany(b => b.Selections).ToList();
                return new Dictionary<string, object?>
                {
                    ["participant_id"] = p.ParticipantId,
                    ["age_range"] = p.AgeRange,
                    ["joined_month"] = ToLocal(p.CreatedAt).ToString("yyyy-MM"),
                    ["books"] = own.Count,
                    ["veggie_books"] = own.Count(b => b.Kind == "veggie"),
                    ["secrets_books"] = own.Count(b => b.Kind == "secrets"),
                    ["recipes_kept"] = sel.Count(s => s.ContentType == "recipe" && s.Kept),
                    ["recipes_removed"] = sel.Count(s => s.ContentType == "recipe" && !s.Kept),
                    ["secrets_kept"] = sel.Count(s => s.ContentType == "secret" && s.Kept),
                    ["secrets_removed"] = sel.Count(s => s.ContentType == "secret" && !s.Kept),
                    ["first_book_date"] = own.Count == 0
                        ? null
                        : ToLocal(own.Min(b => b.CreatedAt)).ToString("yyyy-MM-dd"),
                    ["last_book_date"] = own.Count == 0
                        ? null
                        : ToLocal(own.Max(b => b.CreatedAt)).ToString("yyyy-MM-dd")
                };
            })
            .ToList();

        return new Sheet("participants", "Participants", DateTime.UtcNow, columns, rows);
    }

    // ---- Responses: one row per saved book ----

    public static async Task<Sheet> ResponsesAsync(
        AccountsContext db,
        VeggieBookContext content,
        SheetFilter filter)
    {
        var people = await LoadPeopleAsync(db);
        var userIds = people.Keys.ToList();

        var books = await db.Books
            .AsNoTracking()
            .Where(b => userIds.Contains(b.UserId))
            .Select(b => new
            {
                b.UserId,
                b.Kind,
                b.Language,
                b.VegetableCode,
                b.SecretCategoryId,
                HasUpload = b.CoverUpload != null,
                b.CreatedAt,
                Attributes = b.Attributes.Select(a => a.Attribute).ToList(),
                Selections = b.Selections
                    .Select(s => new { s.ContentType, s.Kept, s.ExtraCopies })
                    .ToList()
            })
            .ToListAsync();

        // Each person's books numbered by date, before any filter, so a
        // person's 3rd book is always "3".
        var bookNumbers = books
            .GroupBy(b => b.UserId)
            .SelectMany(g => g.OrderBy(b => b.CreatedAt).Select((b, i) => (b, n: i + 1)))
            .ToDictionary(x => x.b, x => x.n);

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .ToDictionaryAsync(v => v.Code, v => v.NameEn);

        var categories = await content.SecretCategories
            .AsNoTracking()
            .ToDictionaryAsync(c => c.Id, c => c.NameEn);

        var questions = await content.Questions
            .AsNoTracking()
            .Where(q => !q.IsHidden)
            .OrderBy(q => q.OrderPriority)
            .Select(q => new
            {
                q.IntroEn,
                q.Mnemonic,
                Choices = q.Choices
                    .OrderBy(c => c.SortOrder)
                    .Select(c => new { c.Attribute, c.TextEn })
                    .ToList()
            })
            .ToListAsync();

        // Answer code (HasMicrowave) to its question number and its text.
        var answerLookup = questions
            .SelectMany((q, i) => q.Choices.Select(c => (c.Attribute, Question: i + 1, Text: Fill(c.TextEn))))
            .GroupBy(x => x.Attribute)
            .ToDictionary(g => g.Key, g => g.First());

        var columns = new List<SheetColumn>
        {
            new("participant_id", "Participant ID", "text"),
            new("book_no", "Book number", "number"),
            new("date", $"Date ({Local.Name})", "date"),
            new("time", $"Time ({Local.Name})", "time"),
            new("book_type", "Book type", "text", ["VeggieBook", "Secrets Book"]),
            new("vegetable", "Vegetable", "text",
                vegetables.Values.Order().ToList()),
            new("secrets_category", "Secrets category", "text",
                categories.Values.Order().ToList()),
            new("language", "Language", "text", ["English", "Spanish"]),
            new("cover", "Cover", "text", ["Built-in", "Personal"]),
            new("age_range", "Age range", "text",
                people.Values.Select(p => p.AgeRange).OfType<string>().Distinct().Order().ToList())
        };

        for (var i = 0; i < questions.Count; i++)
        {
            var q = questions[i];
            columns.Add(new SheetColumn(
                $"q{i + 1}",
                $"Q{i + 1}. {Fill(q.IntroEn ?? q.Mnemonic)}",
                "text",
                q.Choices.Select(c => Fill(c.TextEn)).ToList()));
        }

        columns.AddRange(
        [
            new("answers", "Answers picked", "number"),
            new("recipes_kept", "Recipes kept", "number"),
            new("recipes_removed", "Recipes taken out later", "number"),
            new("secrets_kept", "Secrets kept", "number"),
            new("secrets_removed", "Secrets taken out later", "number"),
            new("extra_copies", "Extra copies", "number")
        ]);

        var rows = books
            .Select(b => (Book: b, Person: people[b.UserId], Local: ToLocal(b.CreatedAt)))
            .Where(x => filter.AgeRange is null || x.Person.AgeRange == filter.AgeRange)
            .Where(x => filter.Vegetable is null || x.Book.VegetableCode == filter.Vegetable)
            .Where(x => filter.From is null || DateOnly.FromDateTime(x.Local) >= filter.From)
            .Where(x => filter.To is null || DateOnly.FromDateTime(x.Local) <= filter.To)
            .OrderBy(x => x.Person.ParticipantId)
            .ThenBy(x => x.Book.CreatedAt)
            .Select(x =>
            {
                var b = x.Book;
                var row = new Dictionary<string, object?>
                {
                    ["participant_id"] = x.Person.ParticipantId,
                    ["book_no"] = bookNumbers[b],
                    ["date"] = x.Local.ToString("yyyy-MM-dd"),
                    ["time"] = x.Local.ToString("HH:mm"),
                    ["book_type"] = b.Kind == "secrets" ? "Secrets Book" : "VeggieBook",
                    ["vegetable"] = b.VegetableCode is null
                        ? null
                        : vegetables.GetValueOrDefault(b.VegetableCode, b.VegetableCode),
                    ["secrets_category"] = b.SecretCategoryId is null
                        ? null
                        : categories.GetValueOrDefault(b.SecretCategoryId.Value),
                    ["language"] = b.Language == "es" ? "Spanish" : "English",
                    ["cover"] = b.HasUpload ? "Personal" : "Built-in",
                    ["age_range"] = x.Person.AgeRange
                };

                // One column per question: the answers picked, in the order
                // the question lists them. Empty for Secrets Books, which
                // have no questions.
                for (var i = 0; i < questions.Count; i++)
                {
                    var picked = questions[i].Choices
                        .Where(c => b.Attributes.Contains(c.Attribute))
                        .Select(c => Fill(c.TextEn))
                        .ToList();
                    row[$"q{i + 1}"] = picked.Count == 0 ? null : string.Join("; ", picked);
                }

                row["answers"] = b.Attributes.Count(a => answerLookup.ContainsKey(a));
                row["recipes_kept"] = b.Selections.Count(s => s.ContentType == "recipe" && s.Kept);
                row["recipes_removed"] = b.Selections.Count(s => s.ContentType == "recipe" && !s.Kept);
                row["secrets_kept"] = b.Selections.Count(s => s.ContentType == "secret" && s.Kept);
                row["secrets_removed"] = b.Selections.Count(s => s.ContentType == "secret" && !s.Kept);
                row["extra_copies"] = b.Selections.Where(s => s.Kept).Sum(s => s.ExtraCopies);
                return row;
            })
            .ToList();

        return new Sheet("responses", "Responses", DateTime.UtcNow, columns, rows);
    }

    // Choices for the page's filters.
    public static async Task<object> OptionsAsync(AccountsContext db, VeggieBookContext content)
    {
        var people = await LoadPeopleAsync(db);
        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Where(v => v.Active)
            .OrderBy(v => v.SortOrder)
            .Select(v => new { code = v.Code, name = v.NameEn })
            .ToListAsync();

        return new
        {
            ageRanges = people.Values.Select(p => p.AgeRange).OfType<string>().Distinct().Order().ToList(),
            vegetables
        };
    }

    // The original data has %s where the app put the vegetable's name.
    private static string Fill(string text) => text.Replace("%s", "the vegetable");
}