using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Secrets;

// The Secrets Book content. Read only, and open to guests, the same as the
// vegetables and recipes.
//
//   GET /api/secret-categories                 the five categories, in order
//   GET /api/secret-categories/{id}/secrets    one category's secrets, in full
//   GET /api/secret-categories/{id}/covers     one category's pictures, for
//                                              the cover browser
//
// A Secrets Book has no questions: the user picks a category, then keeps or
// drops each secret in it one at a time. So the second endpoint returns every
// active secret in the category with all of its content, and the review
// screen needs no request per secret.
//
// The third is the cover browser's: only the picture paths, so browsing
// Breakfast, Lunch and the rest does not download every secret's text. Any
// active secret's picture, from any category, is a valid cover, and
// SecretBooksController checks the same rule when a book is saved.
//
// Images: each secret's illustration has words drawn into it, so a Spanish
// request gets the Spanish image when there is one. Most secrets have only
// one image, and it is used for both languages, as the original app did.
//
// Links: secret_link holds each language's links separately, so only the
// requested language's links are returned.

[ApiController]
[Route("api/secret-categories")]
public class SecretsController(VeggieBookContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Categories([FromQuery] string? lang)
    {
        var es = Lang.IsSpanish(lang);

        var rows = await db.SecretCategories
            .AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Id)
            .Select(c => new
            {
                id = c.Id,
                name = es ? c.NameEs : c.NameEn,
                image = c.ImagePath,
                // Hex without the leading #, the same as recipe badges.
                color = c.Color,
                secretCount = c.Secrets.Count(s => s.Active)
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpGet("{id:int}/secrets")]
    public async Task<IActionResult> Secrets(int id, [FromQuery] string? lang)
    {
        var es = Lang.IsSpanish(lang);
        var language = es ? "es" : "en";

        var category = await db.SecretCategories
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new
            {
                id = c.Id,
                name = es ? c.NameEs : c.NameEn,
                image = c.ImagePath,
                color = c.Color
            })
            .FirstOrDefaultAsync();

        if (category is null) return NotFound(new { error = "Unknown category" });

        // display_number still holds the original text IDs (see
        // db/fixes/008_add_secret_body.sql). They rise in the original order,
        // so sorting by them gives the order the original app showed.
        var secrets = await db.Secrets
            .AsNoTracking()
            .Where(s => s.CategoryId == id && s.Active)
            .OrderBy(s => s.DisplayNumber)
            .ThenBy(s => s.Id)
            .Select(s => new
            {
                id = s.Id,
                headline = es ? s.HeadlineEs : s.HeadlineEn,
                body = es ? s.BodyEs : s.BodyEn,
                whyItWorks = es ? s.WhyItWorksEs : s.WhyItWorksEn,
                // Spanish image when there is one, otherwise the shared one.
                image = es && s.ImagePathEs != null && s.ImagePathEs != ""
                    ? s.ImagePathEs
                    : s.ImagePathEn,
                attachment = es ? s.AttachmentEs : s.AttachmentEn,
                links = s.Links
                    .Where(l => l.Language == language)
                    .OrderBy(l => l.Id)
                    .Select(l => new
                    {
                        url = l.Url,
                        label = es ? l.LabelEs : l.LabelEn
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            category,
            secretCount = secrets.Count,
            secrets
        });
    }

    // One category's pictures, in the review's order. Paths only, without
    // duplicates and without secrets that have no picture.
    [HttpGet("{id:int}/covers")]
    public async Task<IActionResult> Covers(int id, [FromQuery] string? lang)
    {
        var es = Lang.IsSpanish(lang);

        if (!await db.SecretCategories.AnyAsync(c => c.Id == id))
            return NotFound(new { error = "Unknown category" });

        var images = await db.Secrets
            .AsNoTracking()
            .Where(s => s.CategoryId == id && s.Active)
            .OrderBy(s => s.DisplayNumber)
            .ThenBy(s => s.Id)
            .Select(s => es && s.ImagePathEs != null && s.ImagePathEs != ""
                ? s.ImagePathEs
                : s.ImagePathEn)
            .ToListAsync();

        var covers = images
            .Where(p => !string.IsNullOrEmpty(p))
            .Distinct()
            .ToList();

        return Ok(covers);
    }
}