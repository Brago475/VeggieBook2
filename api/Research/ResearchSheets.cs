using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// Builds the research sheets. Every row is keyed by the anonymous research
// ID; no email, name, username, or account ID is read here.
//
//   Participants  one row per person
//   Responses     one row per saved book
//   Items         one row per recipe or secret in a saved book
//
// Who is included: real accounts that are not admins. Guests are temporary
// and admin books are tests, so both are left out.
//
// What "taken out later" means: a recipe or secret removed from a saved
// book (Kept = false). Recipes skipped during the review, before saving,
// are not stored, so they can't appear here.
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

    private record Item(string Type, int Id, bool Kept, int ExtraCopies);

    private record BookRow(
        Person Person,
        int BookNo,
        DateTime Local,
        string Kind,
        string Language,
        string? VegetableCode,
        int? SecretCategoryId,
        string? CoverPath,
        bool HasUpload,
        List<string> Attributes,
        List<Item> Items);

    private record Content(
        Dictionary<string, string> Vegetables,
        Dictionary<int, string> Categories,
        Dictionary<int, string> Recipes,
        Dictionary<int, string> Secrets);

    private record QuestionInfo(string Label, List<(string Attribute, string Text)> Choices);

    // ---- Loading ----

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

    // Every book of these people, numbered per person by date before any
    // filter (so a person's 3rd book is always "3"), then filtered.
    private static async Task<List<BookRow>> LoadBooksAsync(
        AccountsContext db,
        Dictionary<Guid, Person> people,
        SheetFilter filter)
    {
        var userIds = people.Keys.ToList();

        var raw = await db.Books
            .AsNoTracking()
            .Where(b => userIds.Contains(b.UserId))
            .Select(b => new
            {
                b.UserId,
                b.Kind,
                b.Language,
                b.VegetableCode,
                b.SecretCategoryId,
                b.CoverPath,
                HasUpload = b.CoverUpload != null,
                b.CreatedAt,
                Attributes = b.Attributes.Select(a => a.Attribute).ToList(),
                Selections = b.Selections
                    .Select(s => new { s.ContentType, s.ContentId, s.Kept, s.ExtraCopies })
                    .ToList()
            })
            .ToListAsync();

        return raw
            .GroupBy(b => b.UserId)
            .SelectMany(g => g
                .OrderBy(b => b.CreatedAt)
                .Select((b, i) => new BookRow(
                    people[b.UserId],
                    i + 1,
                    ToLocal(b.CreatedAt),
                    b.Kind,
                    b.Language,
                    b.VegetableCode,
                    b.SecretCategoryId,
                    b.CoverPath,
                    b.HasUpload,
                    b.Attributes,
                    b.Selections
                        .Select(s => new Item(s.ContentType, s.ContentId, s.Kept, s.ExtraCopies))
                        .ToList())))
            .Where(b => filter.AgeRange is null || b.Person.AgeRange == filter.AgeRange)
            .Where(b => filter.Vegetable is null || b.VegetableCode == filter.Vegetable)
            .Where(b => filter.From is null || DateOnly.FromDateTime(b.Local) >= filter.From)
            .Where(b => filter.To is null || DateOnly.FromDateTime(b.Local) <= filter.To)
            .OrderBy(b => b.Person.ParticipantId)
            .ThenBy(b => b.Local)
            .ToList();
    }

    // Names and titles from the content database, in English.
    private static async Task<Content> LoadContentAsync(VeggieBookContext content)
    {
        var vegetables = await content.Vegetables
            .AsNoTracking()
            .ToDictionaryAsync(v => v.Code, v => v.NameEn);

        var categories = await content.SecretCategories
            .AsNoTracking()
            .ToDictionaryAsync(c => c.Id, c => c.NameEn);

        var recipes = (await content.Recipes
                .AsNoTracking()
                .Select(r => new { r.Id, r.DisplayCode, r.TitleEn })
                .ToListAsync())
            .ToDictionary(r => r.Id, r => r.DisplayCode is null ? r.TitleEn : $"{r.DisplayCode} {r.TitleEn}");

        var secrets = (await content.Secrets
                .AsNoTracking()
                .Select(s => new { s.Id, s.DisplayNumber, s.HeadlineEn })
                .ToListAsync())
            .ToDictionary(s => s.Id, s => $"#{s.DisplayNumber} {s.HeadlineEn}");

        return new Content(vegetables, categories, recipes, secrets);
    }

    private static async Task<List<QuestionInfo>> LoadQuestionsAsync(VeggieBookContext content)
    {
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

        return questions
            .Select(q => new QuestionInfo(
                Fill(q.IntroEn ?? q.Mnemonic),
                q.Choices.Select(c => (c.Attribute, Fill(c.TextEn))).ToList()))
            .ToList();
    }

    // ---- Columns and cells shared by the book sheets ----

    private static List<SheetColumn> BookColumns(Content c, Dictionary<Guid, Person> people) =>
    [
        new("participant_id", "Participant ID", "text"),
        new("book_no", "Book number", "number"),
        new("date", $"Date ({Local.Name})", "date"),
        new("time", $"Time ({Local.Name})", "time"),
        new("book_type", "Book type", "text", ["VeggieBook", "Secrets Book"]),
        new("vegetable", "Vegetable", "text", c.Vegetables.Values.Order().ToList()),
        new("secrets_category", "Secrets category", "text", c.Categories.Values.Order().ToList()),
        new("language", "Language", "text", ["English", "Spanish"]),
        new("cover", "Cover", "text", ["Built-in", "Personal"]),
        new("cover_image", "Cover image (built-in only)", "text"),
        new("age_range", "Age range", "text",
            people.Values.Select(p => p.AgeRange).OfType<string>().Distinct().Order().ToList())
    ];

    private static Dictionary<string, object?> BookCells(BookRow b, Content c) => new()
    {
        ["participant_id"] = b.Person.ParticipantId,
        ["book_no"] = b.BookNo,
        ["date"] = b.Local.ToString("yyyy-MM-dd"),
        ["time"] = b.Local.ToString("HH:mm"),
        ["book_type"] = b.Kind == "secrets" ? "Secrets Book" : "VeggieBook",
        ["vegetable"] = b.VegetableCode is null
            ? null
            : c.Vegetables.GetValueOrDefault(b.VegetableCode, b.VegetableCode),
        ["secrets_category"] = b.SecretCategoryId is null
            ? null
            : c.Categories.GetValueOrDefault(b.SecretCategoryId.Value),
        ["language"] = b.Language == "es" ? "Spanish" : "English",
        ["cover"] = b.HasUpload ? "Personal" : "Built-in",
        // The personal photo itself is never shown or exported.
        ["cover_image"] = b.HasUpload ? null : b.CoverPath,
        ["age_range"] = b.Person.AgeRange
    };

    private static string ItemName(Item item, Content c) => item.Type == "secret"
        ? c.Secrets.GetValueOrDefault(item.Id, $"Secret {item.Id}")
        : c.Recipes.GetValueOrDefault(item.Id, $"Recipe {item.Id}");

    private static string? ItemList(BookRow b, Content c, string type, bool kept)
    {
        var names = b.Items
            .Where(i => i.Type == type && i.Kept == kept)
            .Select(i => ItemName(i, c))
            .Order()
            .ToList();
        return names.Count == 0 ? null : string.Join("; ", names);
    }

    // ---- Participants: one row per person ----

    public static async Task<Sheet> ParticipantsAsync(AccountsContext db, SheetFilter filter)
    {
        var people = await LoadPeopleAsync(db);
        var books = (await LoadBooksAsync(db, people, new SheetFilter(null, null, null, null)))
            .ToLookup(b => b.Person.UserId);

        var columns = new List<SheetColumn>
        {
            new("participant_id", "Participant ID", "text"),
            new("age_range", "Age range", "text",
                people.Values.Select(p => p.AgeRange).OfType<string>().Distinct().Order().ToList()),
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
                var items = own.SelectMany(b => b.Items).ToList();
                return new Dictionary<string, object?>
                {
                    ["participant_id"] = p.ParticipantId,
                    ["age_range"] = p.AgeRange,
                    ["joined_month"] = ToLocal(p.CreatedAt).ToString("yyyy-MM"),
                    ["books"] = own.Count,
                    ["veggie_books"] = own.Count(b => b.Kind == "veggie"),
                    ["secrets_books"] = own.Count(b => b.Kind == "secrets"),
                    ["recipes_kept"] = items.Count(i => i.Type == "recipe" && i.Kept),
                    ["recipes_removed"] = items.Count(i => i.Type == "recipe" && !i.Kept),
                    ["secrets_kept"] = items.Count(i => i.Type == "secret" && i.Kept),
                    ["secrets_removed"] = items.Count(i => i.Type == "secret" && !i.Kept),
                    ["first_book_date"] = own.Count == 0 ? null : own.Min(b => b.Local).ToString("yyyy-MM-dd"),
                    ["last_book_date"] = own.Count == 0 ? null : own.Max(b => b.Local).ToString("yyyy-MM-dd")
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
        var books = await LoadBooksAsync(db, people, filter);
        var c = await LoadContentAsync(content);
        var questions = await LoadQuestionsAsync(content);
        var known = questions.SelectMany(q => q.Choices).Select(x => x.Attribute).ToHashSet();

        var columns = BookColumns(c, people);
        for (var i = 0; i < questions.Count; i++)
        {
            columns.Add(new SheetColumn(
                $"q{i + 1}",
                $"Q{i + 1}. {questions[i].Label}",
                "text",
                questions[i].Choices.Select(x => x.Text).ToList()));
        }
        columns.AddRange(
        [
            new("answers", "Answers picked", "number"),
            new("recipes_kept", "Recipes kept", "number"),
            new("recipes_removed", "Recipes taken out later", "number"),
            new("secrets_kept", "Secrets kept", "number"),
            new("secrets_removed", "Secrets taken out later", "number"),
            new("extra_copies", "Extra copies", "number"),
            new("recipes_kept_list", "Recipes kept (list)", "text"),
            new("recipes_removed_list", "Recipes taken out later (list)", "text"),
            new("secrets_kept_list", "Secrets kept (list)", "text"),
            new("secrets_removed_list", "Secrets taken out later (list)", "text")
        ]);

        var rows = books
            .Select(b =>
            {
                var row = BookCells(b, c);

                // One column per question: the answers picked, in the order
                // the question lists them. Empty for Secrets Books, which
                // have no questions.
                for (var i = 0; i < questions.Count; i++)
                {
                    var picked = questions[i].Choices
                        .Where(x => b.Attributes.Contains(x.Attribute))
                        .Select(x => x.Text)
                        .ToList();
                    row[$"q{i + 1}"] = picked.Count == 0 ? null : string.Join("; ", picked);
                }

                row["answers"] = b.Attributes.Count(known.Contains);
                row["recipes_kept"] = b.Items.Count(i => i.Type == "recipe" && i.Kept);
                row["recipes_removed"] = b.Items.Count(i => i.Type == "recipe" && !i.Kept);
                row["secrets_kept"] = b.Items.Count(i => i.Type == "secret" && i.Kept);
                row["secrets_removed"] = b.Items.Count(i => i.Type == "secret" && !i.Kept);
                row["extra_copies"] = b.Items.Where(i => i.Kept).Sum(i => i.ExtraCopies);
                row["recipes_kept_list"] = ItemList(b, c, "recipe", kept: true);
                row["recipes_removed_list"] = ItemList(b, c, "recipe", kept: false);
                row["secrets_kept_list"] = ItemList(b, c, "secret", kept: true);
                row["secrets_removed_list"] = ItemList(b, c, "secret", kept: false);
                return row;
            })
            .ToList();

        return new Sheet("responses", "Responses", DateTime.UtcNow, columns, rows);
    }

    // ---- Items: one row per recipe or secret in a saved book ----

    public static async Task<Sheet> ItemsAsync(
        AccountsContext db,
        VeggieBookContext content,
        SheetFilter filter)
    {
        var people = await LoadPeopleAsync(db);
        var books = await LoadBooksAsync(db, people, filter);
        var c = await LoadContentAsync(content);

        var columns = BookColumns(c, people);
        columns.AddRange(
        [
            new("item_type", "Item type", "text", ["Recipe", "Secret"]),
            new("item_title", "Item", "text"),
            new("status", "Status", "text", ["Kept", "Taken out later"]),
            new("extra_copies", "Extra copies", "number")
        ]);

        var rows = books
            .SelectMany(b => b.Items
                .OrderBy(i => i.Type)
                .ThenBy(i => ItemName(i, c))
                .Select(i =>
                {
                    var row = BookCells(b, c);
                    row["item_type"] = i.Type == "secret" ? "Secret" : "Recipe";
                    row["item_title"] = ItemName(i, c);
                    row["status"] = i.Kept ? "Kept" : "Taken out later";
                    row["extra_copies"] = i.Kept ? i.ExtraCopies : 0;
                    return row;
                }))
            .ToList();

        return new Sheet("items", "Recipes and secrets", DateTime.UtcNow, columns, rows);
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