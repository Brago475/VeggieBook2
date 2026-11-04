using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books;

// Records a print or download in the activity log.
//
//   POST /api/books/{id}/pdf-log   { action, recipeId?, secretId?, extras? }
//
// action is "print" or "download". With no recipeId, secretId or extras, the
// whole book was used. The app calls this when the button is pressed, then
// opens or saves the PDF (BookPdfController), so one press is one line.
// Each line carries the book's id, so All Data can count them per book.
//
// Same ownership rules as BookPdfController. Guests and admins are never
// logged (ActivityLog). The response never depends on whether a line was
// written, so logging can never block a print or download.

public record PdfLogRequest(string? Action, int? RecipeId, int? SecretId, bool? Extras);

[ApiController]
[Route("api/books")]
[Authorize]
public class BookPdfLogController(
    AccountsContext db,
    ILogger<BookPdfLogController> logger) : ControllerBase
{
    [HttpPost("{id:guid}/pdf-log")]
    public async Task<IActionResult> Log(Guid id, [FromBody] PdfLogRequest req)
    {
        var uid = AuthSetup.UserId(User);
        if (uid is null) return Unauthorized();

        var kind = req.Action switch
        {
            "print" => ActivityLog.BookPrinted,
            "download" => ActivityLog.BookDownloaded,
            _ => null
        };
        if (kind is null) return BadRequest();

        var book = await db.Books
            .AsNoTracking()
            .Where(b => b.Id == id && b.UserId == uid)
            .Select(b => new
            {
                b.Kind,
                b.VegetableCode,
                b.SecretCategoryId,
                Kept = b.Selections
                    .Where(s => s.Kept)
                    .Select(s => new { s.ContentType, s.ContentId, s.ExtraCopies })
                    .ToList()
            })
            .FirstOrDefaultAsync();
        if (book is null) return NotFound();

        string scope;
        int? contentId = null;
        int pages;

        if (req.RecipeId is int recipeId)
        {
            if (book.Kind != "veggie"
                || !book.Kept.Any(s => s.ContentType == "recipe" && s.ContentId == recipeId))
                return NotFound();
            scope = ActivityLog.ScopeRecipe;
            contentId = recipeId;
            pages = 1;
        }
        else if (req.SecretId is int secretId)
        {
            if (book.Kind != "secrets"
                || !book.Kept.Any(s => s.ContentType == "secret" && s.ContentId == secretId))
                return NotFound();
            scope = ActivityLog.ScopeSecret;
            contentId = secretId;
            pages = 1;
        }
        else if (req.Extras == true)
        {
            pages = book.Kept.Sum(s => s.ExtraCopies);
            if (pages == 0) return NotFound();
            scope = ActivityLog.ScopeExtras;
        }
        else
        {
            scope = ActivityLog.ScopeBook;
            pages = book.Kept.Count;
        }

        var entry = await ActivityLog.ForPdfAsync(
            db, logger, uid.Value, id, kind, book.Kind, book.VegetableCode, book.SecretCategoryId,
            scope, contentId, pages);
        await ActivityLog.SaveAsync(db, logger, entry);

        return Ok(new { ok = true });
    }
}