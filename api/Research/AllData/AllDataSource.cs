using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research.AllData;

// Loads everything the All Data page needs, in one place:
//
//   people     real, non-admin accounts with their research IDs
//   books      every saved book, numbered per person (1 = first book)
//   content    vegetable, category, recipe, and secret names
//   questions  the visible profiling questions and their answer choices
//
// Same rules as ResearchSheets.cs: guests and admins are left out, rows are
// keyed by the anonymous research ID, and no email or name is read.
// Dates and times are Eastern (Kean is in New Jersey), or UTC if the server
// can't find that time zone.

// One answer choice. Key is the SPSS-safe column name (q1_1, q1_2...).
public record AllDataChoice(
    string Key,
    string Text,
    [property: JsonIgnore] string Attribute);

// One question, numbered in the order people see it.
public record AllDataQuestion(int No, string Label, IReadOnlyList<AllDataChoice> Choices);

internal record AdPerson(Guid UserId, string ParticipantId, DateTime CreatedAt, string? AgeRange);

internal record AdItem(string Type, int Id, bool Kept, int ExtraCopies);

internal record AdBook(
    AdPerson Person,
    int BookNo,
    DateTime Local,
    string Kind,
    string Language,
    string? VegetableCode,
    int? SecretCategoryId,
    string? CoverPath,
    bool HasUpload,
    HashSet<string> Attributes,
    List<AdItem> Items);

// A recipe or secret: its code (BR-201 or #5832) and its title.
internal record AdItemInfo(string? Code, string Title);

internal record AdContent(
    Dictionary<string, string> Vegetables,
    Dictionary<int, string> Categories,
    Dictionary<int, AdItemInfo> Recipes,
    Dictionary<int, AdItemInfo> Secrets);

internal record AdData(
    Dictionary<Guid, AdPerson> People,
    List<AdBook> Books,
    AdContent Content);

internal static class AllDataSource
{
    public static readonly (TimeZoneInfo Zone, string Name) Local = FindZone();

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

    public static async Task<AdData> LoadAsync(
        AccountsContext db,
        VeggieBookContext content,
        SheetFilter filter)
    {
        var people = await LoadPeopleAsync(db);
        var books = await LoadBooksAsync(db, people, filter);
        var names = await LoadContentAsync(content);
        return new AdData(people, books, names);
    }

    public static async Task<List<AllDataQuestion>> LoadQuestionsAsync(VeggieBookContext content)
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
            .Select((q, i) => new AllDataQuestion(
                i + 1,
                Fill(q.IntroEn ?? q.Mnemonic),
                q.Choices
                    .Select((c, j) => new AllDataChoice($"q{i + 1}_{j + 1}", Fill(c.TextEn), c.Attribute))
                    .ToList()))
            .ToList();
    }

    // Real, non-admin accounts with their research IDs, giving IDs to any
    // that don't have one yet.
    private static async Task<Dictionary<Guid, AdPerson>> LoadPeopleAsync(AccountsContext db)
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
                u => new AdPerson(
                    u.Id,
                    ids[u.Id],
                    u.CreatedAt,
                    string.IsNullOrEmpty(u.AgeRange) ? null : u.AgeRange));
    }

    // Every book of these people, numbered per person by date before any
    // filter (so a person's 3rd book is always "3"), then filtered.
    private static async Task<List<AdBook>> LoadBooksAsync(
        AccountsContext db,
        Dictionary<Guid, AdPerson> people,
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
                .Select((b, i) => new AdBook(
                    people[b.UserId],
                    i + 1,
                    ToLocal(b.CreatedAt),
                    b.Kind,
                    b.Language,
                    b.VegetableCode,
                    b.SecretCategoryId,
                    b.CoverPath,
                    b.HasUpload,
                    b.Attributes.ToHashSet(),
                    b.Selections
                        .Select(s => new AdItem(s.ContentType, s.ContentId, s.Kept, s.ExtraCopies))
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
    private static async Task<AdContent> LoadContentAsync(VeggieBookContext content)
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
            .ToDictionary(r => r.Id, r => new AdItemInfo(r.DisplayCode, r.TitleEn));

        var secrets = (await content.Secrets
                .AsNoTracking()
                .Select(s => new { s.Id, s.DisplayNumber, s.HeadlineEn })
                .ToListAsync())
            .ToDictionary(s => s.Id, s => new AdItemInfo($"#{s.DisplayNumber}", s.HeadlineEn));

        return new AdContent(vegetables, categories, recipes, secrets);
    }

    // The original data has %s where the app put the vegetable's name.
    private static string Fill(string text) => text.Replace("%s", "the vegetable");
}