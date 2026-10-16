using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Admin;

// Content the admin site opens from its lists.
//
//   GET /api/admin/content/library?study=3
//        every vegetable, recipe, secret category and secret, in English,
//        with how often each recipe or secret was kept or taken out later.
//        study (optional) counts only books saved while that study ran.
//   GET /api/admin/content/secrets/{id}
//        one secret, in full, in English
//
// Admins only. Read-only: the content database is never changed here.
// Counts follow the All Data rules (AllDataSource): tracked books only, no
// admin or guest books. Only totals are sent, never research IDs.
// Retired recipes and secrets are included (active = false), since saved
// books can still hold them.

[ApiController]
[Route("api/admin/content")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminContentController(VeggieBookContext content, AccountsContext db) : ControllerBase
{
    private static readonly SheetFilter NoFilter = new(null, null, null, null);

    [HttpGet("library")]
    public async Task<IActionResult> Library([FromQuery] int? study)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null)
            return NotFound(new { error = $"There is no Study {study}. It may have been deleted." });

        var data = await AllDataSource.LoadAsync(db, content, NoFilter, window);

        var tally = data.Books
            .SelectMany(b => b.Items)
            .GroupBy(i => (i.Type, i.Id))
            .ToDictionary(g => g.Key, g => (Kept: g.Count(i => i.Kept), Out: g.Count(i => !i.Kept)));

        (int Kept, int Out) CountOf(string type, int id) => tally.GetValueOrDefault((type, id));

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .OrderBy(v => v.SortOrder)
            .Select(v => new
            {
                code = v.Code,
                shortCode = v.ShortCode,
                name = v.NameEn,
                image = v.ImagePath,
                active = v.Active
            })
            .ToListAsync();

        var recipeRows = await content.Recipes
            .AsNoTracking()
            .OrderBy(r => r.DisplayCode == null)
            .ThenBy(r => r.DisplayCode)
            .ThenBy(r => r.Id)
            .Select(r => new
            {
                r.Id,
                Code = r.DisplayCode,
                r.VegetableCode,
                Title = r.TitleEn,
                r.Active,
                Photo = r.Photos.OrderBy(p => p.Position).Select(p => p.ImagePath).FirstOrDefault()
            })
            .ToListAsync();

        var recipes = recipeRows.Select(r =>
        {
            var count = CountOf("recipe", r.Id);
            return new
            {
                id = r.Id,
                code = r.Code,
                vegetable = r.VegetableCode,
                title = r.Title,
                active = r.Active,
                photo = r.Photo,
                kept = count.Kept,
                takenOut = count.Out
            };
        }).ToList();

        var categories = await content.SecretCategories
            .AsNoTracking()
            .OrderBy(c => c.Id)
            .Select(c => new { id = c.Id, name = c.NameEn, image = c.ImagePath })
            .ToListAsync();

        var secretRows = await content.Secrets
            .AsNoTracking()
            .OrderBy(s => s.Category == null ? int.MaxValue : s.Category.Id)
            .ThenBy(s => s.DisplayNumber)
            .Select(s => new
            {
                s.Id,
                Number = s.DisplayNumber,
                s.Active,
                CategoryId = s.Category == null ? (int?)null : s.Category.Id,
                Headline = s.HeadlineEn,
                Image = s.ImagePathEn
            })
            .ToListAsync();

        var secrets = secretRows.Select(s =>
        {
            var count = CountOf("secret", s.Id);
            return new
            {
                id = s.Id,
                number = s.Number,
                active = s.Active,
                category = s.CategoryId,
                headline = s.Headline,
                image = s.Image,
                kept = count.Kept,
                takenOut = count.Out
            };
        }).ToList();

        Response.Headers.CacheControl = "no-store";

        return Ok(new { vegetables, recipes, categories, secrets });
    }

    [HttpGet("secrets/{id:int}")]
    public async Task<IActionResult> Secret(int id)
    {
        var secret = await content.Secrets
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new
            {
                id = s.Id,
                number = s.DisplayNumber,
                active = s.Active,
                category = s.Category == null ? null : s.Category.NameEn,
                headline = s.HeadlineEn,
                body = s.BodyEn,
                whyItWorks = s.WhyItWorksEn,
                image = s.ImagePathEn,
                attachment = s.AttachmentEn,
                links = s.Links
                    .Where(l => l.Language == "en")
                    .Select(l => new { url = l.Url, label = l.LabelEn })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        return secret is null ? NotFound() : Ok(secret);
    }
}