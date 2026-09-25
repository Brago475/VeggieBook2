using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Covers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books;

// Changing a saved book's cover, as the original app allowed.
//
//   PUT /api/books/{id}/cover   set a new cover on one of this account's books
//
// Works for both kinds of book, with the same rules as when the book was
// made:
//   a VeggieBook   a cover from the catalog (Covers/CoverCatalog.cs), or
//                  an upload
//   a Secrets Book any active secret's picture, or an upload
//
// Exactly one of coverPath or coverUpload is sent. An upload replaces the
// book's old uploaded photo if it had one. Choosing a picture instead
// deletes the uploaded photo, so a private photo the book no longer shows
// is not kept.
//
// Same rules as BooksController: a signed-in account only, and a book
// belonging to someone else answers 404, the same as one that does not
// exist. Nothing the client sends is trusted.

public record ChangeCoverRequest(string? CoverPath, string? CoverUpload);

[ApiController]
[Route("api/books")]
[Authorize]
public class BookCoverController(AccountsContext db, VeggieBookContext content)
    : ControllerBase
{
    private Guid CurrentUserId =>
        AuthSetup.UserId(User)
        ?? throw new InvalidOperationException("Signed-in user has no id.");

    // Base64 makes a 400 KB photo about 550 KB of JSON, which fits both this
    // limit and nginx's default 1 MB request limit.
    [HttpPut("{id:guid}/cover")]
    [RequestSizeLimit(1_000_000)]
    public async Task<IActionResult> Change(Guid id, [FromBody] ChangeCoverRequest req)
    {
        var uid = CurrentUserId;

        var book = await db.Books
            .Include(b => b.CoverUpload)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == uid);
        if (book is null) return NotFound();

        // Exactly one cover: a picture, or an upload.
        var hasPreset = !string.IsNullOrEmpty(req.CoverPath);
        var hasUpload = !string.IsNullOrEmpty(req.CoverUpload);
        if (hasPreset == hasUpload)
            return BadRequest(new { error = "Choose one cover." });

        if (hasPreset)
        {
            var path = req.CoverPath!;
            var allowed = book.Kind == "secrets"
                ? await content.Secrets.AnyAsync(s =>
                    s.Active && (s.ImagePathEn == path || s.ImagePathEs == path))
                : await CoverCatalog.IsAllowed(content, path);
            if (!allowed)
                return BadRequest(new { error = "Unknown cover." });

            book.CoverPath = path;

            // The uploaded photo is no longer shown, so it is not kept.
            if (book.CoverUpload is not null)
            {
                db.BookCoverUploads.Remove(book.CoverUpload);
                book.CoverUpload = null;
            }
        }
        else
        {
            var bytes = JpegUpload.Decode(req.CoverUpload!);
            if (bytes is null)
                return BadRequest(new
                {
                    error = "This photo could not be used. Try a different photo."
                });

            book.CoverPath = null;

            if (book.CoverUpload is not null)
            {
                book.CoverUpload.ContentType = "image/jpeg";
                book.CoverUpload.Data = bytes;
            }
            else
            {
                book.CoverUpload = new BookCoverUpload
                {
                    SessionId = book.Id,
                    ContentType = "image/jpeg",
                    Data = bytes
                };
            }
        }

        await db.SaveChangesAsync();

        // An upload is always served from the same address, so the answer
        // adds a number that changes with every upload. Without it the
        // browser can keep showing the photo it already has.
        var cover = hasUpload
            ? $"/api/books/{book.Id}/cover?v={DateTime.UtcNow.Ticks}"
            : book.CoverPath!;

        return Ok(new { cover });
    }
}