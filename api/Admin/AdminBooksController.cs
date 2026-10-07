using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// One account's saved books, for the admin page.
//
//   GET /api/admin/accounts/{id}/books
//
// Admins only (Roles.AdminPolicy). Guests never appear here.
//
// Shows what each book holds: its vegetable or Secrets category, the answers
// to the questions, the kept recipes or secrets, and the ones the user took
// out later (kept = false, see BooksController.RemoveRecipe).
//
// Uploaded cover photos are never shown to the admin. The photo bytes are
// not read from the database here at all; the response only says
// "personal" so the admin knows a photo exists. Built-in covers are shared
// public images, so their path is sent and the admin page can show them.
//
// Titles are in English, since the admin page is in English. The book's own
// language is included so the admin can see which one the user chose.

[ApiController]
[Route("api/admin/accounts/{id:guid}/books")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminBooksController(AccountsContext db, VeggieBookContext content)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid id)
    {
        var exists = await db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == id && u.GuestExpiresAt == null);
        if (!exists) return NotFound();

        var books = await db.Books
            .AsNoTracking()
            .Where(b => b.UserId == id)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.Id,
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

        // Names and titles come from the content database, a separate
        // context. One query per kind of content for all books together,
        // not one per book or per item.
        var vegetableCodes = books
            .Where(b => b.VegetableCode != null)
            .Select(b => b.VegetableCode!)
            .Distinct()
            .ToArray();
        var categoryIds = books
            .Where(b => b.SecretCategoryId != null)
            .Select(b => b.SecretCategoryId!.Value)
            .Distinct()
            .ToArray();
        var recipeIds = books
            .SelectMany(b => b.Selections)
            .Where(s => s.ContentType == "recipe")
            .Select(s => s.ContentId)
            .Distinct()
            .ToArray();
        var secretIds = books
            .SelectMany(b => b.Selections)
            .Where(s => s.ContentType == "secret")
            .Select(s => s.ContentId)
            .Distinct()
            .ToArray();

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Where(v => vegetableCodes.Contains(v.Code))
            .ToDictionaryAsync(v => v.Code, v => v.NameEn);

        var categories = await content.SecretCategories
            .AsNoTracking()
            .Where(c => categoryIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.NameEn);

        var recipes = await content.Recipes
            .AsNoTracking()
            .Where(r => recipeIds.Contains(r.Id))
            .Select(r => new { r.Id, r.DisplayCode, r.TitleEn })
            .ToDictionaryAsync(r => r.Id);

        var secrets = await content.Secrets
            .AsNoTracking()
            .Where(s => secretIds.Contains(s.Id))
            .Select(s => new { s.Id, s.DisplayNumber, s.HeadlineEn })
            .ToDictionaryAsync(s => s.Id);

        // A recipe or secret since removed from the content database still
        // shows, by id, so the record of what the user chose stays complete.
        object Item(string type, int contentId, int extraCopies)
        {
            if (type == "recipe" && recipes.TryGetValue(contentId, out var r))
                return new { type, id = contentId, code = r.DisplayCode, title = r.TitleEn, extraCopies };
            if (type == "secret" && secrets.TryGetValue(contentId, out var s))
                return new { type, id = contentId, code = $"#{s.DisplayNumber}", title = s.HeadlineEn, extraCopies };
            return new { type, id = contentId, code = (string?)null, title = $"Removed content ({type} {contentId})", extraCopies };
        }

        return Ok(books.Select(b => new
        {
            id = b.Id,
            kind = b.Kind,
            language = b.Language,
            createdAt = b.CreatedAt,
            vegetable = b.VegetableCode is null
                ? null
                : new
                {
                    code = b.VegetableCode,
                    name = vegetables.GetValueOrDefault(b.VegetableCode, b.VegetableCode)
                },
            secretCategory = b.SecretCategoryId is null
                ? null
                : new
                {
                    id = b.SecretCategoryId,
                    name = categories.GetValueOrDefault(b.SecretCategoryId.Value, $"Category {b.SecretCategoryId}")
                },
            cover = b.HasUpload
                ? new { type = "personal", path = (string?)null }
                : new { type = "builtin", path = b.CoverPath },
            answers = b.Attributes.OrderBy(a => a).ToList(),
            kept = b.Selections
                .Where(s => s.Kept)
                .Select(s => Item(s.ContentType, s.ContentId, s.ExtraCopies))
                .ToList(),
            removed = b.Selections
                .Where(s => !s.Kept)
                .Select(s => Item(s.ContentType, s.ContentId, 0))
                .ToList()
        }));
    }
}