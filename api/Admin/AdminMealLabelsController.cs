using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Playlists;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Admin;

// The Meal labels screen.
//
//   GET /api/admin/meal-labels             every active recipe and every tip,
//                                          in English, with photo and labels
//   PUT /api/admin/meal-labels/{kind}/{id} set one item's labels,
//                                          body { meals: ["lunch", "dinner"] }
//
// Labels live in meal_label; recipe and tip tables are never changed.
// Admins only. Every change is written to the activity log with the admin
// who made it. If two admins save the same item at the same moment, the
// slower one is asked to refresh.

public record MealLabelsRequest(List<string>? Meals);

[ApiController]
[Route("api/admin/meal-labels")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminMealLabelsController(
    AccountsContext db,
    VeggieBookContext content,
    UserManager<AppUser> users,
    ILogger<AdminMealLabelsController> logger) : ControllerBase
{
    private const int SnippetLength = 120;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var labels = await db.MealLabels
            .AsNoTracking()
            .Select(m => new { m.Kind, m.ItemId, m.Meal })
            .ToListAsync();
        var byItem = labels.ToLookup(l => (l.Kind, l.ItemId), l => l.Meal);

        var order = await content.Vegetables
            .AsNoTracking()
            .ToDictionaryAsync(v => v.Code, v => v.SortOrder);
        int OrderOf(string code) => order.GetValueOrDefault(code, int.MaxValue);

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Where(v => v.Active)
            .OrderBy(v => v.SortOrder)
            .Select(v => new { code = v.Code, name = v.NameEn, image = v.ImagePath })
            .ToListAsync();

        var recipeRows = await content.Recipes
            .AsNoTracking()
            .Where(r => r.Active)
            .Select(r => new
            {
                r.Id,
                r.DisplayCode,
                r.VegetableCode,
                r.TitleEn,
                Photos = r.Photos.OrderBy(p => p.Position).Select(p => p.ImagePath).ToList()
            })
            .ToListAsync();

        var tipRows = await content.Tips
            .AsNoTracking()
            .Select(t => new
            {
                t.Id,
                t.VegetableCode,
                t.HeadingEn,
                t.SortOrder,
                First = t.Blocks.OrderBy(b => b.Position).Select(b => b.TextEn).FirstOrDefault(),
                Image = t.Blocks.Where(b => b.ImagePath != null).OrderBy(b => b.Position)
                    .Select(b => b.ImagePath).FirstOrDefault()
            })
            .ToListAsync();

        var recipes = recipeRows
            .OrderBy(r => OrderOf(r.VegetableCode))
            .ThenBy(r => r.DisplayCode == null)
            .ThenBy(r => r.DisplayCode)
            .ThenBy(r => r.Id)
            .Select(r => new
            {
                kind = PlaylistKinds.Recipe,
                id = r.Id,
                code = r.DisplayCode,
                vegetable = r.VegetableCode,
                title = r.TitleEn,
                photo = RecipePhotos.Finished(r.Photos),
                snippet = (string?)null,
                meals = Meals.Ordered(byItem[(PlaylistKinds.Recipe, r.Id)])
            })
            .ToList();

        var tips = tipRows
            .OrderBy(t => OrderOf(t.VegetableCode))
            .ThenBy(t => t.SortOrder)
            .Select(t => new
            {
                kind = PlaylistKinds.Tip,
                id = t.Id,
                code = (string?)null,
                vegetable = t.VegetableCode,
                title = t.HeadingEn,
                photo = t.Image,
                snippet = Clip(t.First),
                meals = Meals.Ordered(byItem[(PlaylistKinds.Tip, t.Id)])
            })
            .ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            meals = Meals.All.Select(m => new { key = m.Key, en = m.En }),
            vegetables,
            recipes,
            tips
        });
    }

    [HttpPut("{kind}/{id:int}")]
    public async Task<IActionResult> Set(string kind, int id, [FromBody] MealLabelsRequest req)
    {
        if (!PlaylistKinds.IsKnown(kind)) return NotFound();

        var wanted = (req.Meals ?? []).Distinct().ToList();
        if (wanted.Any(m => !Meals.IsKnown(m)))
            return BadRequest(new { error = "Use Breakfast, Lunch, Dinner, or Snack." });

        var exists = kind == PlaylistKinds.Recipe
            ? await content.Recipes.AnyAsync(r => r.Id == id)
            : await content.Tips.AnyAsync(t => t.Id == id);
        if (!exists) return NotFound(new { error = "That item no longer exists. Refresh the page." });

        var current = await db.MealLabels.Where(m => m.Kind == kind && m.ItemId == id).ToListAsync();
        var before = Meals.Ordered(current.Select(c => c.Meal));
        var after = Meals.Ordered(wanted);
        if (before.SequenceEqual(after)) return Ok(new { kind, id, meals = after });

        db.MealLabels.RemoveRange(current.Where(c => !after.Contains(c.Meal)));

        var now = DateTime.UtcNow;
        var admin = AdminId();
        foreach (var meal in after.Where(m => current.All(c => c.Meal != m)))
            db.MealLabels.Add(new MealLabel { Kind = kind, ItemId = id, Meal = meal, CreatedAt = now, CreatedBy = admin });

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Another admin saved this item at the same moment.
            db.ChangeTracker.Clear();
            return Conflict(new
            {
                error = "Another admin changed this item's labels at the same moment. Refresh to see them.",
                changed = true
            });
        }

        await PlaylistActivity.RecordAdminLineAsync(
            db, logger, PlaylistActivity.MealLabelsChanged, id,
            $"{kind}|{Meals.Names(after)}|{Meals.Names(before)}", admin);

        return Ok(new { kind, id, meals = after });
    }

    private static string? Clip(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var t = text.Trim();
        return t.Length <= SnippetLength ? t : t[..SnippetLength].TrimEnd() + "...";
    }

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}