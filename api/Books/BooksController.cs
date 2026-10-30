using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Covers;
using VeggieBook.Api.Data;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Books;

// Saved books. Every endpoint requires a signed-in account, and every query
// filters by that account, so one user can never see or change another's
// books. A book that belongs to someone else answers 404, not 403.
//
//   GET    /api/books                        this account's books, newest first
//   GET    /api/books/{id}                   one book in full, with recipe titles
//   POST   /api/books                        save a finished book
//   DELETE /api/books/{id}                   delete a book
//   DELETE /api/books/{id}/recipes/{recipe}  take one recipe out of a book
//   GET    /api/books/{id}/cover             the book's uploaded cover photo
//
// Nothing the client sends is trusted: the vegetable, every answer, every
// recipe, and the cover are checked against the database before saving.
//
// A Secrets Book is saved by SecretBooksController; listing, opening and
// deleting work the same for both kinds.
//
// Saving, deleting and taking a recipe out each write an activity log line
// (Activity/ActivityLog.cs); the log never blocks the action.
//
// Messages carry a code the site translates (ErrorCodes, ApiError).

public record BookRecipe(int Id, int ExtraCopies);

// Dropped: recipes dropped during Keep/Drop, recorded for research only.
public record CreateBookRequest(
    string? VegetableCode,
    string[]? Attributes,
    BookRecipe[]? Recipes,
    string? CoverPath,
    string? CoverUpload,
    string? Lang,
    int[]? Dropped);

[ApiController]
[Route("api/books")]
[Authorize]
public class BooksController(
    AccountsContext db,
    VeggieBookContext content,
    ILogger<BooksController> logger) : ControllerBase
{
    // At 50 books with a 400 KB cover each, one account holds at most about 20 MB.
    private const int MaxBooksPerUser = 50;
    private const int MaxRecipesPerBook = 100;
    private const int MaxAttributes = 50;
    private const int MaxExtraCopies = 10;
    private const int MaxCoverBytes = 400 * 1024;   // matches the database check

    private const string JpegDataUrl = "data:image/jpeg;base64,";

    private Guid CurrentUserId =>
        AuthSetup.UserId(User)
        ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var uid = CurrentUserId;

        var rows = await db.Books
            .AsNoTracking()
            .Where(b => b.UserId == uid)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.Id,
                b.Kind,
                b.VegetableCode,
                b.SecretCategoryId,
                b.CoverPath,
                HasUpload = b.CoverUpload != null,
                // Kept recipes in a VeggieBook, kept secrets in a Secrets Book.
                RecipeCount = b.Selections.Count(s =>
                    s.Kept && (s.ContentType == "recipe" || s.ContentType == "secret")),
                b.CreatedAt
            })
            .ToListAsync();

        return Ok(rows.Select(b => new
        {
            id = b.Id,
            kind = b.Kind,
            vegetableCode = b.VegetableCode,
            secretCategoryId = b.SecretCategoryId,
            cover = CoverUrl(b.Id, b.CoverPath, b.HasUpload),
            recipeCount = b.RecipeCount,
            createdAt = b.CreatedAt
        }));
    }

    // One book with its kept recipes, their titles and finished-dish photo.
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, [FromQuery] string? lang)
    {
        var uid = CurrentUserId;

        var book = await db.Books
            .AsNoTracking()
            .Where(b => b.Id == id && b.UserId == uid)
            .Select(b => new
            {
                b.Id,
                b.Kind,
                b.VegetableCode,
                b.SecretCategoryId,
                b.CoverPath,
                HasUpload = b.CoverUpload != null,
                b.CreatedAt,
                Attributes = b.Attributes.Select(a => a.Attribute).ToList(),
                Recipes = b.Selections
                    .Where(s => s.ContentType == "recipe" && s.Kept)
                    .Select(s => new { id = s.ContentId, extraCopies = s.ExtraCopies })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (book is null) return NotFound();

        // Titles and photos come from the content database: one query for the whole book.
        var ids = book.Recipes.Select(r => r.id).ToArray();
        var spanish = Lang.IsSpanish(lang);

        var details = await content.Recipes
            .AsNoTracking()
            .Where(r => ids.Contains(r.Id))
            .Select(r => new
            {
                r.Id,
                r.DisplayCode,
                Title = spanish ? r.TitleEs : r.TitleEn,
                Photos = r.Photos
                    .OrderBy(p => p.Position)
                    .Select(p => p.ImagePath)
                    .ToList()
            })
            .ToListAsync();

        var byId = details.ToDictionary(t => t.Id);

        // Coded recipes first in code order, then uncoded by id. A recipe since
        // removed from the content database is skipped.
        var recipes = book.Recipes
            .Where(r => byId.ContainsKey(r.id))
            .Select(r => new
            {
                id = r.id,
                extraCopies = r.extraCopies,
                displayCode = byId[r.id].DisplayCode,
                title = byId[r.id].Title,
                photo = RecipePhotos.Finished(byId[r.id].Photos)
            })
            .OrderBy(r => r.displayCode == null)
            .ThenBy(r => r.displayCode)
            .ThenBy(r => r.id)
            .ToList();

        return Ok(new
        {
            id = book.Id,
            kind = book.Kind,
            vegetableCode = book.VegetableCode,
            secretCategoryId = book.SecretCategoryId,
            cover = CoverUrl(book.Id, book.CoverPath, book.HasUpload),
            createdAt = book.CreatedAt,
            attributes = book.Attributes,
            recipes
        });
    }

    // Base64 makes a 400 KB photo about 550 KB of JSON, within this limit and nginx's 1 MB.
    [HttpPost]
    [RequestSizeLimit(1_000_000)]
    public async Task<IActionResult> Create([FromBody] CreateBookRequest req)
    {
        var uid = CurrentUserId;

        if (await db.Books.CountAsync(b => b.UserId == uid) >= MaxBooksPerUser)
            return Conflict(new ApiError(ErrorCodes.BookLimit,
                $"You can keep up to {MaxBooksPerUser} books. Delete one to make room.")
            { Values = new { max = MaxBooksPerUser } }.Body());

        var vegetable = await content.Vegetables
            .FirstOrDefaultAsync(v => v.Code == req.VegetableCode && v.Active);
        if (vegetable is null)
            return BadRequest(new ApiError(ErrorCodes.UnknownVegetable, "Unknown vegetable.").Body());

        // Answers must be real attributes from the questions.
        var attributes = (req.Attributes ?? []).Distinct().ToArray();
        if (attributes.Length > MaxAttributes)
            return BadRequest(new ApiError(ErrorCodes.TooManyAnswers, "Too many answers.").Body());
        var knownAttributes = await content.Attributes
            .CountAsync(a => attributes.Contains(a.Name));
        if (knownAttributes != attributes.Length)
            return BadRequest(new ApiError(ErrorCodes.UnknownAnswer, "Unknown answer.").Body());

        // Kept recipes must be real, active, and for this book's vegetable.
        var recipes = req.Recipes ?? [];
        if (recipes.Length > MaxRecipesPerBook)
            return BadRequest(new ApiError(ErrorCodes.TooManyRecipes, "Too many recipes.").Body());
        var recipeIds = recipes.Select(r => r.Id).Distinct().ToArray();
        if (recipeIds.Length != recipes.Length)
            return BadRequest(new ApiError(ErrorCodes.RecipeTwice, "A recipe is listed twice.").Body());
        if (recipes.Any(r => r.ExtraCopies is < 0 or > MaxExtraCopies))
            return BadRequest(new ApiError(ErrorCodes.ExtraCopiesRange,
                "Extra copies must be between 0 and 10.")
            { Values = new { min = 0, max = MaxExtraCopies } }.Body());
        var validRecipes = await content.Recipes.CountAsync(r =>
            recipeIds.Contains(r.Id) && r.VegetableCode == vegetable.Code && r.Active);
        if (validRecipes != recipeIds.Length)
            return BadRequest(new ApiError(ErrorCodes.UnknownRecipe, "Unknown recipe.").Body());

        // Dropped recipes are research data only: anything invalid is ignored
        // rather than blocking the save.
        var droppedIds = (req.Dropped ?? [])
            .Distinct()
            .Where(id => !recipeIds.Contains(id))
            .Take(MaxRecipesPerBook)
            .ToArray();
        if (droppedIds.Length > 0)
        {
            droppedIds = await content.Recipes
                .Where(r => droppedIds.Contains(r.Id) && r.VegetableCode == vegetable.Code && r.Active)
                .Select(r => r.Id)
                .ToArrayAsync();
        }

        // Exactly one cover: one from the catalog, or an upload.
        var hasPreset = !string.IsNullOrEmpty(req.CoverPath);
        var hasUpload = !string.IsNullOrEmpty(req.CoverUpload);
        if (hasPreset == hasUpload)
            return BadRequest(new ApiError(ErrorCodes.ChooseOneCover, "Choose one cover.").Body());

        byte[]? upload = null;
        if (hasPreset)
        {
            if (!await CoverCatalog.IsAllowed(content, req.CoverPath!))
                return BadRequest(new ApiError(ErrorCodes.UnknownCover, "Unknown cover.").Body());
        }
        else
        {
            upload = DecodeJpeg(req.CoverUpload!);
            if (upload is null)
                return BadRequest(new ApiError(ErrorCodes.PhotoUnusable,
                    "This photo could not be used. Try a different photo.").Body());
        }

        var book = new Book
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            Kind = "veggie",
            Language = Lang.IsSpanish(req.Lang) ? "es" : "en",
            VegetableCode = vegetable.Code,
            CoverPath = hasPreset ? req.CoverPath : null,
            CreatedAt = DateTime.UtcNow,
            Attributes = attributes
                .Select(a => new BookAttribute { Attribute = a })
                .ToList(),
            Selections = recipes
                .Select(r => new BookSelection
                {
                    ContentType = "recipe",
                    ContentId = r.Id,
                    Kept = true,
                    ExtraCopies = r.ExtraCopies
                })
                .Concat(droppedIds.Select(id => new BookSelection
                {
                    ContentType = "recipe",
                    ContentId = id,
                    Kept = false,
                    DroppedInReview = true
                }))
                .ToList(),
            CoverUpload = upload is null
                ? null
                : new BookCoverUpload { ContentType = "image/jpeg", Data = upload }
        };

        db.Books.Add(book);
        await db.SaveChangesAsync();

        // At matches the book's CreatedAt so the Activity page can pair the line with the book.
        var saved = await ActivityLog.ForBookAsync(
            db, logger, uid, "veggie", vegetable.Code, null, recipes.Length,
            ActivityLog.BookSaved, droppedIds.Length);
        if (saved is not null) saved.At = book.CreatedAt;
        await ActivityLog.SaveAsync(db, logger, saved);

        return Created($"/api/books/{book.Id}", new { id = book.Id });
    }

    // Deletes in one statement; the database cascades to answers, items and cover.
    // The activity line is prepared first and saved once the delete succeeds.
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var uid = CurrentUserId;

        var info = await db.Books
            .AsNoTracking()
            .Where(b => b.Id == id && b.UserId == uid)
            .Select(b => new
            {
                b.Kind,
                b.VegetableCode,
                b.SecretCategoryId,
                Items = b.Selections.Count(s => s.Kept)
            })
            .FirstOrDefaultAsync();
        if (info is null) return NotFound();

        var entry = await ActivityLog.ForBookAsync(
            db, logger, uid, info.Kind, info.VegetableCode, info.SecretCategoryId, info.Items);

        var removed = await db.Books
            .Where(b => b.Id == id && b.UserId == uid)
            .ExecuteDeleteAsync();
        if (removed == 0) return NotFound();

        await ActivityLog.SaveAsync(db, logger, entry);
        return NoContent();
    }

    // Takes one recipe out of a saved book. The row stays with Kept = false so
    // research data shows it was taken out later. The last recipe cannot be
    // taken out; deleting the book clears it.
    [HttpDelete("{id:guid}/recipes/{recipeId:int}")]
    public async Task<IActionResult> RemoveRecipe(Guid id, int recipeId)
    {
        var uid = CurrentUserId;

        var book = await db.Books
            .Include(b => b.Selections)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == uid);
        if (book is null) return NotFound();

        var kept = book.Selections
            .Where(s => s.ContentType == "recipe" && s.Kept)
            .ToList();

        var target = kept.FirstOrDefault(s => s.ContentId == recipeId);
        if (target is null) return NotFound();

        if (kept.Count == 1)
            return Conflict(new ApiError(ErrorCodes.LastRecipe,
                "A book needs at least one recipe. Delete the book instead.").Body());

        target.Kept = false;
        await db.SaveChangesAsync();

        var entry = await ActivityLog.ForBookAsync(
            db, logger, uid, "veggie", book.VegetableCode, null, 1, ActivityLog.ItemRemoved);
        await ActivityLog.SaveAsync(db, logger, entry);

        return NoContent();
    }

    [HttpGet("{id:guid}/cover")]
    public async Task<IActionResult> Cover(Guid id)
    {
        var uid = CurrentUserId;

        var data = await db.BookCoverUploads
            .AsNoTracking()
            .Where(c => c.SessionId == id
                     && db.Books.Any(b => b.Id == id && b.UserId == uid))
            .Select(c => c.Data)
            .FirstOrDefaultAsync();

        if (data is null) return NotFound();

        // Personal photo: never cached, never treated as anything but an image.
        Response.Headers["Cache-Control"] = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(data, "image/jpeg");
    }

    // Uploads are served through the API so only the owner can see them.
    private static string CoverUrl(Guid id, string? coverPath, bool hasUpload) =>
        hasUpload ? $"/api/books/{id}/cover" : coverPath ?? "";

    // Accepts only a JPEG data URL whose bytes start with the JPEG signature.
    private static byte[]? DecodeJpeg(string dataUrl)
    {
        if (!dataUrl.StartsWith(JpegDataUrl, StringComparison.Ordinal)) return null;

        var base64 = dataUrl.AsSpan(JpegDataUrl.Length);
        if (base64.Length > (MaxCoverBytes + 2) / 3 * 4) return null;

        var buffer = new byte[base64.Length * 3 / 4 + 3];
        if (!Convert.TryFromBase64Chars(base64, buffer, out var written)) return null;
        if (written < 4 || written > MaxCoverBytes) return null;
        if (buffer[0] != 0xFF || buffer[1] != 0xD8 || buffer[2] != 0xFF) return null;

        return buffer.AsSpan(0, written).ToArray();
    }
}