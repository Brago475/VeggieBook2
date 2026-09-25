using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books;

// Saving a Secrets Book.
//
//   POST /api/books/secrets   save a finished Secrets Book
//
// Everything else about a saved book (listing, opening, deleting, serving
// an uploaded cover) goes through BooksController, which works for both
// kinds. Only saving differs, because a Secrets Book is built differently:
// one category instead of a vegetable, secrets instead of recipes, and no
// answers.
//
// The cover is exactly one of:
//   coverPath    any active secret's picture, from any category, as the
//                cover browser offers them (GET /api/secret-categories/
//                {id}/covers)
//   coverUpload  the user's own photo, as a JPEG data URL. Stored in
//                book_cover_upload and served only to the owner, the same
//                as a VeggieBook's upload.
//
// Same rules as BooksController: a signed-in account only, and nothing the
// client sends is trusted. The category, every secret, and the cover are
// checked against the database before saving.
//
// Only kept secrets are stored, the same as kept recipes in a VeggieBook.

public record BookSecret(int Id, int ExtraCopies);

public record CreateSecretsBookRequest(
    int? CategoryId,
    BookSecret[]? Secrets,
    string? CoverPath,
    string? CoverUpload,
    string? Lang);

[ApiController]
[Route("api/books/secrets")]
[Authorize]
public class SecretBooksController(AccountsContext db, VeggieBookContext content)
    : ControllerBase
{
    // The same limits as BooksController, so both kinds of book count
    // toward one total per account and take the same size of photo.
    private const int MaxBooksPerUser = 50;
    private const int MaxSecretsPerBook = 100;
    private const int MaxExtraCopies = 10;
    private const int MaxCoverBytes = 400 * 1024;   // matches the database check

    private const string JpegDataUrl = "data:image/jpeg;base64,";

    private Guid CurrentUserId =>
        AuthSetup.UserId(User)
        ?? throw new InvalidOperationException("Signed-in user has no id.");

    // Base64 makes a 400 KB photo about 550 KB of JSON, which fits both this
    // limit and nginx's default 1 MB request limit.
    [HttpPost]
    [RequestSizeLimit(1_000_000)]
    public async Task<IActionResult> Create([FromBody] CreateSecretsBookRequest req)
    {
        var uid = CurrentUserId;

        if (await db.Books.CountAsync(b => b.UserId == uid) >= MaxBooksPerUser)
            return Conflict(new
            {
                error = $"You can keep up to {MaxBooksPerUser} books. Delete one to make room."
            });

        var category = await content.SecretCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == req.CategoryId);
        if (category is null)
            return BadRequest(new { error = "Unknown kind of secret." });

        // Secrets must be real, active, and in this book's category.
        var secrets = req.Secrets ?? [];
        if (secrets.Length == 0)
            return BadRequest(new { error = "A Secrets Book needs at least one secret." });
        if (secrets.Length > MaxSecretsPerBook)
            return BadRequest(new { error = "Too many secrets." });

        var secretIds = secrets.Select(s => s.Id).Distinct().ToArray();
        if (secretIds.Length != secrets.Length)
            return BadRequest(new { error = "A secret is listed twice." });
        if (secrets.Any(s => s.ExtraCopies is < 0 or > MaxExtraCopies))
            return BadRequest(new { error = "Extra copies must be between 0 and 10." });

        var validSecrets = await content.Secrets.CountAsync(s =>
            secretIds.Contains(s.Id) && s.CategoryId == category.Id && s.Active);
        if (validSecrets != secretIds.Length)
            return BadRequest(new { error = "Unknown secret." });

        // Exactly one cover: a secret's picture, or an upload.
        var hasPreset = !string.IsNullOrEmpty(req.CoverPath);
        var hasUpload = !string.IsNullOrEmpty(req.CoverUpload);
        if (hasPreset == hasUpload)
            return BadRequest(new { error = "Choose one cover." });

        byte[]? upload = null;
        if (hasPreset)
        {
            // Any active secret's picture, in either language, since the
            // browser shows the Spanish picture for a Spanish book.
            var path = req.CoverPath!;
            var known = await content.Secrets.AnyAsync(s =>
                s.Active && (s.ImagePathEn == path || s.ImagePathEs == path));
            if (!known)
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
                .ToList(),
            CoverUpload = upload is null
                ? null
                : new BookCoverUpload { ContentType = "image/jpeg", Data = upload }
        };

        db.Books.Add(book);
        await db.SaveChangesAsync();

        return Created($"/api/books/{book.Id}", new { id = book.Id });
    }

    // The same check as BooksController.DecodeJpeg, copied rather than
    // shared so the VeggieBook save stays exactly as it was. If one changes,
    // change the other to match.
    //
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