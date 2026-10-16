using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// One account's saved books, for the admin page.
//
//   GET /api/admin/accounts/{id}/books
//
// Admins only. Guests never appear here, and admin accounts appear to the
// root admin only.
//
// Uploaded cover photos are never read here; the response only says
// "personal". Built-in covers are public images, so their path is sent.
// Titles are in English; the book's own language is included.

[ApiController]
[Route("api/admin/accounts/{id:guid}/books")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminBooksController(
    AccountsContext db,
    VeggieBookContext content,
    UserManager<AppUser> users,
    IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid id)
    {
        var exists = await db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == id && u.GuestExpiresAt == null);
        if (!exists) return NotFound();

        if (!await AdminRules.IsRootAsync(User, users, config))
        {
            var adminRoleId = await db.Roles.Where(r => r.Name == Roles.Admin).Select(r => r.Id).FirstAsync();
            if (await db.UserRoles.AnyAsync(r => r.UserId == id && r.RoleId == adminRoleId)) return NotFound();
        }

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

        // One query per kind of content for all books together.
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

        // Content since removed still shows, by id, so the record stays complete.
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