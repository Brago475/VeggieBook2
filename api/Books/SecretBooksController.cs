using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books;

// Secrets Books: saving one, opening one, and taking a secret out.
//
//   POST   /api/books/secrets                    save a finished Secrets Book
//   GET    /api/books/{id}/secrets               one Secrets Book: category, cover, kept secrets
//   DELETE /api/books/{id}/secrets/{secretId}    take one secret out
//
// Listing, deleting a whole book, and serving an uploaded cover go through
// BooksController. The viewer loads secret text and pictures from
// /api/secret-categories/{id}/secrets; this sends only which secrets are kept.
//
// The cover is exactly one of: coverPath (any active secret's picture) or
// coverUpload (a JPEG data URL, stored privately).
//
// Same rules as BooksController: signed-in only, every query filters by the
// account, nothing the client sends is trusted. Saving and taking a secret
// out each write an activity log line.

public record BookSecret(int Id, int ExtraCopies);

// Dropped: secrets dropped during Keep/Drop, recorded for research only.
public record CreateSecretsBookRequest(
    int? CategoryId,
    BookSecret[]? Secrets,
    string? CoverPath,
    string? CoverUpload,
    string? Lang,
    int[]? Dropped);

[ApiController]
[Route("api/books")]
[Authorize]
public class SecretBooksController(
    AccountsContext db,
    VeggieBookContext content,
    ILogger<SecretBooksController> logger) : ControllerBase
{
    // Same limits as BooksController; both kinds count toward one total.
    private const int MaxBooksPerUser = 50;
    private const int MaxSecretsPerBook = 100;
    private const int MaxExtraCopies = 10;
    private const int MaxCoverBytes = 400 * 1024;   // matches the database check

    private const string JpegDataUrl = "data:image/jpeg;base64,";

    private Guid CurrentUserId =>
        AuthSetup.UserId(User)
        ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpPost("secrets")]
    [RequestSizeLimit(1_000_000)]
    public async Task<IActionResult> Create([FromBody] CreateSecretsBookRequest req)
    {
        var uid = CurrentUserId;

        if (await db.Books.CountAsync(b => b.UserId == uid) >= MaxBooksPerUser)
            return Conflict(new ApiError(ErrorCodes.BookLimit,
                $"You can keep up to {MaxBooksPerUser} books. Delete one to make room.")
            { Values = new { max = MaxBooksPerUser } }.Body());

        var category = await content.SecretCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == req.CategoryId);
        if (category is null)
            return BadRequest(new ApiError(ErrorCodes.UnknownCategory, "Unknown kind of secret.").Body());

        // Kept secrets must be real, active, and in this book's category.
        var secrets = req.Secrets ?? [];
        if (secrets.Length == 0)
            return BadRequest(new ApiError(ErrorCodes.SecretsRequired,
                "A Secrets Book needs at least one secret.").Body());
        if (secrets.Length > MaxSecretsPerBook)
            return BadRequest(new ApiError(ErrorCodes.TooManySecrets, "Too many secrets.").Body());

        var secretIds = secrets.Select(s => s.Id).Distinct().ToArray();
        if (secretIds.Length != secrets.Length)
            return BadRequest(new ApiError(ErrorCodes.SecretTwice, "A secret is listed twice.").Body());
        if (secrets.Any(s => s.ExtraCopies is < 0 or > MaxExtraCopies))
            return BadRequest(new ApiError(ErrorCodes.ExtraCopiesRange,
                "Extra copies must be between 0 and 10.")
            { Values = new { min = 0, max = MaxExtraCopies } }.Body());

        var validSecrets = await content.Secrets.CountAsync(s =>
            secretIds.Contains(s.Id) && s.CategoryId == category.Id && s.Active);
        if (validSecrets != secretIds.Length)
            return BadRequest(new ApiError(ErrorCodes.UnknownSecret, "Unknown secret.").Body());

        // Dropped secrets are research data only: anything invalid is ignored.
        var droppedIds = (req.Dropped ?? [])
            .Distinct()
            .Where(id => !secretIds.Contains(id))
            .Take(MaxSecretsPerBook)
            .ToArray();
        if (droppedIds.Length > 0)
        {
            droppedIds = await content.Secrets
                .Where(s => droppedIds.Contains(s.Id) && s.CategoryId == category.Id && s.Active)
                .Select(s => s.Id)
                .ToArrayAsync();
        }

        // Exactly one cover: a secret's picture, or an upload.
        var hasPreset = !string.IsNullOrEmpty(req.CoverPath);
        var hasUpload = !string.IsNullOrEmpty(req.CoverUpload);
        if (hasPreset == hasUpload)
            return BadRequest(new ApiError(ErrorCodes.ChooseOneCover, "Choose one cover.").Body());

        byte[]? upload = null;
        if (hasPreset)
        {
            // Either language's picture, since a Spanish book shows the Spanish one.
            var path = req.CoverPath!;
            var known = await content.Secrets.AnyAsync(s =>
                s.Active && (s.ImagePathEn == path || s.ImagePathEs == path));
            if (!known)
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
            Kind = "secrets",
            Language = Lang.IsSpanish(req.Lang) ? "es" : "en",
            VegetableCode = null,
            SecretCategoryId = category.Id,
            CoverPath = hasPreset ? req.CoverPath : null,
            CreatedAt = DateTime.UtcNow,
            Selections = secrets
                .Select(s => new BookSelection
                {
                    ContentType = "secret",
                    ContentId = s.Id,
                    Kept = true,
                    ExtraCopies = s.ExtraCopies
                })
                .Concat(droppedIds.Select(id => new BookSelection
                {
                    ContentType = "secret",
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
            db, logger, uid, "secrets", null, category.Id, secrets.Length,
            ActivityLog.BookSaved, droppedIds.Length);
        if (saved is not null) saved.At = book.CreatedAt;
        await ActivityLog.SaveAsync(db, logger, saved);

        return Created($"/api/books/{book.Id}", new { id = book.Id });
    }

    // One Secrets Book: which secrets it keeps, in the order they were kept.
    [HttpGet("{id:guid}/secrets")]
    public async Task<IActionResult> Get(Guid id)
    {
        var uid = CurrentUserId;

        var book = await db.Books
            .AsNoTracking()
            .Where(b => b.Id == id && b.UserId == uid && b.Kind == "secrets")
            .Select(b => new
            {
                b.Id,
                b.SecretCategoryId,
                b.CoverPath,
                HasUpload = b.CoverUpload != null,
                b.CreatedAt,
                Secrets = b.Selections
                    .Where(s => s.ContentType == "secret" && s.Kept)
                    .Select(s => new { id = s.ContentId, extraCopies = s.ExtraCopies })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (book is null) return NotFound();

        return Ok(new
        {
            id = book.Id,
            kind = "secrets",
            secretCategoryId = book.SecretCategoryId,
            cover = book.HasUpload ? $"/api/books/{book.Id}/cover" : book.CoverPath ?? "",
            createdAt = book.CreatedAt,
            secrets = book.Secrets
        });
    }

    // Takes one secret out of a saved book, the same way as a recipe. The last
    // secret cannot be taken out; deleting the book clears it.
    [HttpDelete("{id:guid}/secrets/{secretId:int}")]
    public async Task<IActionResult> RemoveSecret(Guid id, int secretId)
    {
        var uid = CurrentUserId;

        var book = await db.Books
            .Include(b => b.Selections)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == uid && b.Kind == "secrets");
        if (book is null) return NotFound();

        var kept = book.Selections
            .Where(s => s.ContentType == "secret" && s.Kept)
            .ToList();

        var target = kept.FirstOrDefault(s => s.ContentId == secretId);
        if (target is null) return NotFound();

        if (kept.Count == 1)
            return Conflict(new ApiError(ErrorCodes.LastSecret,
                "A book needs at least one secret. Delete the book instead.").Body());

        target.Kept = false;
        await db.SaveChangesAsync();

        var entry = await ActivityLog.ForBookAsync(
            db, logger, uid, "secrets", null, book.SecretCategoryId, 1, ActivityLog.ItemRemoved);
        await ActivityLog.SaveAsync(db, logger, entry);

        return NoContent();
    }

    // Same check as BooksController.DecodeJpeg. If one changes, change both.
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