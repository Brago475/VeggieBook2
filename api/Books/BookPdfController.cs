using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Books.Print;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books;

// A saved book as a PDF, for printing or downloading.
//
//   GET /api/books/{id}/pdf?lang=es              opens in the browser (print)
//   GET /api/books/{id}/pdf?lang=es&download=1   saves as a file
//
// Same rules as BooksController: a signed-in account only, and a book that
// belongs to someone else answers 404. The PDF is in the language asked
// for, or the language the book was made in. Never cached, since a book
// can hold a personal cover photo.

[ApiController]
[Route("api/books")]
[Authorize]
public class BookPdfController(
    AccountsContext db,
    VeggieBookContext content,
    IConfiguration config) : ControllerBase
{
    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> Pdf(Guid id, [FromQuery] string? lang, [FromQuery] bool download = false)
    {
        var uid = AuthSetup.UserId(User);
        if (uid is null) return Unauthorized();

        var book = await db.Books
            .AsNoTracking()
            .Where(b => b.Id == id && b.UserId == uid)
            .Select(b => new BookPrint(
                b.Id,
                b.Kind,
                b.Language,
                b.VegetableCode,
                b.SecretCategoryId,
                b.CoverPath,
                b.CoverUpload != null ? b.CoverUpload.Data : null,
                b.CreatedAt,
                b.Attributes.Select(a => a.Attribute).ToList(),
                b.Selections
                    .Where(s => s.Kept && (s.ContentType == "recipe" || s.ContentType == "secret"))
                    .Select(s => new BookPrintItem(s.ContentId, s.ExtraCopies))
                    .ToList()))
            .FirstOrDefaultAsync();
        if (book is null) return NotFound();

        var es = Lang.IsSpanish(string.IsNullOrEmpty(lang) ? book.Language : lang);
        var images = BookImages.Root(config);

        var file = book.Kind == "secrets"
            ? await SecretsBookPdf.BuildAsync(content, book, es, images)
            : await VeggieBookPdf.BuildAsync(content, book, es, images);

        Response.Headers.CacheControl = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        if (download) return File(file.Bytes, "application/pdf", file.FileName);

        Response.Headers.ContentDisposition = $"inline; filename=\"{file.FileName}\"";
        return File(file.Bytes, "application/pdf");
    }
}