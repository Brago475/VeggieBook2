using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Admin;

// The admin site's Books page: every book in the study data, by research ID,
// and one book opened the way VeggieBook shows it.
//
//   GET /api/admin/books?study=3
//        every book, newest first, with the counts for the cards at the top
//        of the page. study (optional) keeps only the books saved while
//        that study ran. A study that doesn't exist gives 404.
//   GET /api/admin/books/{researchId}/{bookNo}
//        one book in full: its answers, the studies it was saved during,
//        and every recipe or secret it kept or had taken out later
//
// A book is named by its research ID and number ("VB2-K7M4-Q9PX", book 3 is
// that person's third book), the same as in the All Data files, so the
// admin site never handles a book's database id.
//
// The same rules as All Data (Research/AllData/AllDataSource.cs): only
// books saved while the person's tracking was on, never an admin's or a
// guest's book, and no email or name anywhere. Uploaded cover photos are
// never sent; the response only says the book has one. Built-in covers are
// public images, so their path is sent.
//
// Read only. Nothing here changes a book.

[ApiController]
[Route("api/admin/books")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminBooksPageController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private static readonly SheetFilter NoFilter = new(null, null, null, null);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? study)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null)
            return NotFound(new { error = $"There is no Study {study}. It may have been deleted." });

        var data = await AllDataSource.LoadAsync(db, content, NoFilter, window);
        var pictures = await PicturesAsync();

        var books = data.Books
            .OrderByDescending(b => b.Local)
            .Select(b => Summary(b, data.Content, pictures))
            .ToList();

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            counts = new
            {
                all = data.Books.Count,
                veggie = data.Books.Count(b => b.Kind == "veggie"),
                secrets = data.Books.Count(b => b.Kind == "secrets"),
                takenOut = data.Books.Sum(b => b.Items.Count(i => !i.Kept))
            },
            books
        });
    }

    [HttpGet("{researchId}/{bookNo:int}")]
    public async Task<IActionResult> Get(string researchId, int bookNo)
    {
        var id = (researchId ?? "").Trim().ToUpperInvariant();

        var data = await AllDataSource.LoadAsync(db, content, NoFilter);
        var book = data.Books.FirstOrDefault(b => b.Person.ParticipantId == id && b.BookNo == bookNo);
        if (book is null)
            return NotFound(new
            {
                error = "This book is not in the study data. It may have been deleted, or saved while tracking was off."
            });

        var pictures = await PicturesAsync();
        var questions = await AllDataSource.LoadQuestionsAsync(content);

        // The answers, in question order: "Q2" and the answer's words.
        var answers = questions
            .SelectMany(q => q.Choices
                .Where(c => book.Attributes.Contains(c.Attribute))
                .Select(c => new { question = q.No, text = c.Text }))
            .ToList();

        // Every study that was running when the book was saved. Tracking was
        // already on at that moment, or the book would not be here.
        var savedUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(book.Local, DateTimeKind.Unspecified), AllDataSource.Local.Zone);
        var studies = (await db.Studies.AsNoTracking().ToListAsync())
            .Where(s => s.StartedAt <= savedUtc && (s.EndedAt is null || s.EndedAt >= savedUtc))
            .OrderBy(s => s.Number)
            .Select(s => new { number = s.Number, title = StudyData.TitleOf(s) })
            .ToList();

        // Recipes in the same order as the app (coded first, in code order);
        // secrets in the order they were kept.
        var kept = Ordered(book.Items.Where(i => i.Kept), data.Content).ToList();
        var removed = Ordered(book.Items.Where(i => !i.Kept), data.Content).ToList();

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            book = Summary(book, data.Content, pictures),
            vegetableCode = book.VegetableCode,
            secretCategoryId = book.SecretCategoryId,
            answers,
            studies,
            keptItems = kept,
            removedItems = removed
        });
    }

    // The vegetable's photo and each Secrets category's picture, for the
    // background of a book's cover card, as the app shows it.
    private async Task<(Dictionary<string, string?> Vegetables, Dictionary<int, string?> Categories)> PicturesAsync()
    {
        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Select(v => new { v.Code, v.ImagePath })
            .ToDictionaryAsync(v => v.Code, v => (string?)v.ImagePath);

        var categories = await content.SecretCategories
            .AsNoTracking()
            .Select(c => new { c.Id, c.ImagePath })
            .ToDictionaryAsync(c => c.Id, c => (string?)c.ImagePath);

        return (vegetables, categories);
    }

    private static object Summary(
        AdBook b,
        AdContent names,
        (Dictionary<string, string?> Vegetables, Dictionary<int, string?> Categories) pictures)
    {
        var secrets = b.Kind == "secrets";

        var subject = secrets
            ? (b.SecretCategoryId is int c ? names.Categories.GetValueOrDefault(c) ?? $"Category {c}" : "Secrets")
            : (b.VegetableCode is string v ? names.Vegetables.GetValueOrDefault(v) ?? v : "VeggieBook");

        var background = secrets
            ? (b.SecretCategoryId is int c2 ? pictures.Categories.GetValueOrDefault(c2) : null)
            : (b.VegetableCode is string v2 ? pictures.Vegetables.GetValueOrDefault(v2) : null);

        return new
        {
            key = $"{b.Person.ParticipantId}-{b.BookNo}",
            researchId = b.Person.ParticipantId,
            bookNo = b.BookNo,
            kind = b.Kind,
            language = b.Language,
            savedAt = b.Local.ToString("yyyy-MM-ddTHH:mm:ss"),
            subjectCode = secrets ? b.SecretCategoryId?.ToString() : b.VegetableCode,
            subject,
            background = string.IsNullOrEmpty(background) ? null : background,
            cover = b.HasUpload ? null : b.CoverPath,
            personalCover = b.HasUpload,
            kept = b.Items.Count(i => i.Kept),
            removed = b.Items.Count(i => !i.Kept)
        };
    }

    // A recipe or secret since removed from the content still shows, by id,
    // so the record of what the person chose stays complete.
    private static IEnumerable<object> Ordered(IEnumerable<AdItem> items, AdContent names) =>
        items
            .Select(i =>
            {
                var info = i.Type == "recipe"
                    ? names.Recipes.GetValueOrDefault(i.Id)
                    : names.Secrets.GetValueOrDefault(i.Id);
                return (Item: i, Info: info);
            })
            .OrderBy(x => x.Item.Type == "recipe" ? (x.Info?.Code is null ? 1 : 0) : 0)
            .ThenBy(x => x.Item.Type == "recipe" ? x.Info?.Code : null, StringComparer.Ordinal)
            .ThenBy(x => x.Item.Type == "recipe" ? x.Item.Id : 0)
            .Select(x => (object)new
            {
                type = x.Item.Type,
                id = x.Item.Id,
                code = x.Info?.Code,
                title = x.Info?.Title ?? $"Removed content ({x.Item.Type} {x.Item.Id})",
                image = x.Info?.Image,
                extraCopies = x.Item.ExtraCopies,
                missing = x.Info is null
            });
}