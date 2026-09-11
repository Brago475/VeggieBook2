using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books;

// Saved books. Every endpoint requires a signed-in account, and every query
// filters by that account, so one user can never see or change another's
// books. A book that belongs to someone else answers 404, not 403, so the
// API never confirms that it exists.
//
//   GET    /api/books             this account's books, newest first
//   GET    /api/books/{id}        one book in full
//   POST   /api/books             save a finished book
//   DELETE /api/books/{id}        delete a book
//   GET    /api/books/{id}/cover  the book's uploaded cover photo
//
// Guests never call these. A guest's book lives only in the open page and is
// gone when it closes.
//
// Nothing the client sends is trusted: the vegetable, every answer, every
// recipe, and the cover are checked against the database before saving.

public record BookRecipe(int Id, int ExtraCopies);

public record CreateBookRequest(
    string? VegetableCode,
    string[]? Attributes,
    BookRecipe[]? Recipes,
    string? CoverPath,
    string? CoverUpload,
    string? Lang);

[ApiController]
[Route("api/books")]
[Authorize]
public class BooksController(AccountsContext db, VeggieBookContext content)
    : ControllerBase
{
    // Limits on what one account can store. At 50 books with a 400 KB cover
    // each, one account holds at most about 20 MB.
    private const int MaxBooksPerUser = 50;
    private const int MaxRecipesPerBook = 100;
    private const int MaxAttributes = 50;
    private const int MaxExtraCopies = 10;
    private const int MaxCoverBytes = 400 * 1024;   // matches the database check

    private const string JpegDataUrl = "data:image/jpeg;base64,";

    // Covers offered to every book, matching SHARED_COVERS in
    // web/src/pages/CoverChooser.tsx. cornucopia.jpg goes in both lists once
    // the owner provides the file.
    private static readonly string[] SharedCovers = [];

    private static readonly Regex VegetableCover =
        new(@"^cover/([A-Z]{2})\.jpg$", RegexOptions.CultureInvariant);

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
                b.CoverPath,
                HasUpload = b.CoverUpload != null,
                RecipeCount = b.Selections.Count(s => s.ContentType == "recipe" && s.Kept),
                b.CreatedAt
            })
            .ToListAsync();

        return Ok(rows.Select(b => new
        {
            id = b.Id,
            kind = b.Kind,
            vegetableCode = b.VegetableCode,
            cover = CoverUrl(b.Id, b.CoverPath, b.HasUpload),
            recipeCount = b.RecipeCount,
            createdAt = b.CreatedAt
        }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
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

        return Ok(new
        {
            id = book.Id,
            kind = book.Kind,
            vegetableCode = book.VegetableCode,
            cover = CoverUrl(book.Id, book.CoverPath, book.HasUpload),
            createdAt = book.CreatedAt,
            attributes = book.Attributes,
            recipes = book.Recipes
        });
    }

    // Base64 makes a 400 KB photo about 550 KB of JSON, which fits both this
    // limit and nginx's default 1 MB request limit.
    [HttpPost]
    [RequestSizeLimit(1_000_000)]
    public async Task<IActionResult> Create([FromBody] CreateBookRequest req)
    {
        var uid = CurrentUserId;

        if (await db.Books.CountAsync(b => b.UserId == uid) >= MaxBooksPerUser)
            return Conflict(new
            {
                error = $"You can keep up to {MaxBooksPerUser} books. Delete one to make room."
            });

        var vegetable = await content.Vegetables
            .FirstOrDefaultAsync(v => v.Code == req.VegetableCode && v.Active);
        if (vegetable is null)
            return BadRequest(new { error = "Unknown vegetable." });

        // Answers must be real attributes from the questions.
        var attributes = (req.Attributes ?? []).Distinct().ToArray();
        if (attributes.Length > MaxAttributes)
            return BadRequest(new { error = "Too many answers." });
        var knownAttributes = await content.Attributes
            .CountAsync(a => attributes.Contains(a.Name));
        if (knownAttributes != attributes.Length)
            return BadRequest(new { error = "Unknown answer." });

        // Recipes must be real, active, and for this book's vegetable.
        var recipes = req.Recipes ?? [];
        if (recipes.Length > MaxRecipesPerBook)
            return BadRequest(new { error = "Too many recipes." });
        var recipeIds = recipes.Select(r => r.Id).Distinct().ToArray();
        if (recipeIds.Length != recipes.Length)
            return BadRequest(new { error = "A recipe is listed twice." });
        if (recipes.Any(r => r.ExtraCopies is < 0 or > MaxExtraCopies))
            return BadRequest(new { error = "Extra copies must be between 0 and 10." });
        var validRecipes = await content.Recipes.CountAsync(r =>
            recipeIds.Contains(r.Id) && r.VegetableCode == vegetable.Code && r.Active);
        if (validRecipes != recipeIds.Length)
            return BadRequest(new { error = "Unknown recipe." });

        // Exactly one cover: a preset or an upload.
        var hasPreset = !string.IsNullOrEmpty(req.CoverPath);
        var hasUpload = !string.IsNullOrEmpty(req.CoverUpload);
        if (hasPreset == hasUpload)
            return BadRequest(new { error = "Choose one cover." });

        byte[]? upload = null;
        if (hasPreset)
        {
            if (!await IsPresetCover(req.CoverPath!))
                return BadRequest(new { error = "Unknown cover." });
        }
        else
        {
            upload = DecodeJpeg(req.CoverUpload!);
            if (upload is null)
                return BadRequest(new
                {
                    error = "This photo could not be used. Try a different photo."
                });
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
                .ToList(),
            CoverUpload = upload is null
                ? null
                : new BookCoverUpload { ContentType = "image/jpeg", Data = upload }
        };

        db.Books.Add(book);
        await db.SaveChangesAsync();

        return Created($"/api/books/{book.Id}", new { id = book.Id });
    }

    // Deletes in one statement. The database removes the book's answers,
    // recipes, and uploaded cover through ON DELETE CASCADE.
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var uid = CurrentUserId;
        var removed = await db.Books
            .Where(b => b.Id == id && b.UserId == uid)
            .ExecuteDeleteAsync();

        return removed == 0 ? NotFound() : NoContent();
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

        // no-store keeps a personal photo out of a shared computer's browser
        // cache, and guarantees Cloudflare never caches it for anyone else.
        // nosniff stops a browser from treating the bytes as anything but an
        // image.
        Response.Headers["Cache-Control"] = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(data, "image/jpeg");
    }

    // Uploaded covers are served through the API so only the owner can see
    // them. Presets are public files under /images.
    private static string CoverUrl(Guid id, string? coverPath, bool hasUpload) =>
        hasUpload ? $"/api/books/{id}/cover" : coverPath ?? "";

    // A preset is one of the ten vegetable covers or a shared cover. The
    // pattern check means a path like ../../etc/passwd can never be stored.
    private async Task<bool> IsPresetCover(string path)
    {
        if (SharedCovers.Contains(path)) return true;

        var match = VegetableCover.Match(path);
        if (!match.Success) return false;

        var shortCode = match.Groups[1].Value;
        return await content.Vegetables
            .AnyAsync(v => v.ShortCode == shortCode && v.Active);
    }

    // Accepts only a JPEG data URL, as produced by the site's resizer. The
    // bytes must start with the JPEG signature, so a renamed file of another
    // type is refused even if it claims to be a JPEG.
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