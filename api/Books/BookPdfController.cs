using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Books.Print;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books;

// Saved books as PDFs, for printing or downloading.
//
//   GET /api/books/{id}/pdf                        the whole book
//   GET /api/books/{id}/recipes/{recipeId}/pdf     one recipe's page
//   GET /api/books/{id}/secrets/{secretId}/pdf     one secret's page
//
// Each takes ?lang=en|es (default: the language the book was made in) and
// ?download=1 to save as a file instead of opening in the browser.
//
// Same rules as BooksController: a signed-in account only, and a book, or a
// recipe or secret not kept in it, that belongs to no one here answers 404.
// Never cached, since a book can hold a personal cover photo.

[ApiController]
[Route("api/books")]
[Authorize]
public class BookPdfController(
    AccountsContext db,
    VeggieBookContext content,
    IConfiguration config) : ControllerBase
{
    [HttpGet("{id:guid}/pdf")]
    public Task<IActionResult> Book(Guid id, [FromQuery] string? lang, [FromQuery] bool download = false) =>
        Send(id, null, null, lang, download);

    [HttpGet("{id:guid}/recipes/{recipeId:int}/pdf")]
    public Task<IActionResult> Recipe(Guid id, int recipeId, [FromQuery] string? lang, [FromQuery] bool download = false) =>
        Send(id, "veggie", recipeId, lang, download);

    [HttpGet("{id:guid}/secrets/{secretId:int}/pdf")]
    public Task<IActionResult> Secret(Guid id, int secretId, [FromQuery] string? lang, [FromQuery] bool download = false) =>
        Send(id, "secrets", secretId, lang, download);

    private async Task<IActionResult> Send(Guid id, string? kind, int? only, string? lang, bool download)
    {
        var uid = AuthSetup.UserId(User);
        if (uid is null) return Unauthorized();

        var book = await db.Books
            .AsNoTracking()
            .Where(b => b.Id == id && b.UserId == uid && (kind == null || b.Kind == kind))
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
            ? await SecretsBookPdf.BuildAsync(content, book, es, images, only)
            : await VeggieBookPdf.BuildAsync(content, book, es, images, only);
        if (file is null) return NotFound();

        Response.Headers.CacheControl = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        if (download) return File(file.Bytes, "application/pdf", file.FileName);

        Response.Headers.ContentDisposition = $"inline; filename=\"{file.FileName}\"";
        return File(file.Bytes, "application/pdf");
    }
}