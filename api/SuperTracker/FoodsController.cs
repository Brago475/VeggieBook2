using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.SuperTracker;

// SuperTracker2 food search and details, from the USDA SuperTracker foods
// database. Food names are in English only (USDA data).
//
//   GET /api/supertracker/foods/search?q=&category=   up to 30 matches
//   GET /api/supertracker/foods/{id}                  portions and per-100 g amounts

[ApiController]
[Route("api/supertracker/foods")]
[Authorize]
public class FoodsController(SuperTrackerContext db, AccountsContext accounts) : ControllerBase
{
    private const int MaxResults = 30;

    // Category slugs from db/supertracker/foods_fndds_2011.sql.
    private static readonly string[] Categories =
    [
        "beverages", "breads_cereals", "pasta_rice", "fruits", "vegetables", "dairy", "protein",
        "mixed_meals", "snacks", "additions", "fast_foods", "sweets", "recipe_ingredients"
    ];

    private Guid CurrentUserId =>
        AuthSetup.UserId(User) ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] string? category)
    {
        if (await SuperTrackerAccess.IsGuestAsync(accounts, CurrentUserId)) return SuperTrackerAccess.AccountRequired();

        var words = (q ?? "").Trim().ToLowerInvariant()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Take(6)
            .ToArray();
        if (words.Length == 0 || words.Sum(w => w.Length) < 2) return Ok(Array.Empty<object>());

        IQueryable<St2FoodName> names = db.FoodNames.AsNoTracking();
        foreach (var word in words)
        {
            var pattern = "%" + EscapeLike(word) + "%";
            names = names.Where(n => EF.Functions.ILike(n.Name, pattern));
        }
        if (category is not null && Categories.Contains(category))
        {
            names = names.Where(n => db.Foods.Any(f => f.Id == n.FoodId && f.Categories.Contains(category)));
        }

        var hits = await names
            .OrderBy(n => n.Priority)
            .Select(n => new { n.FoodId, n.Name, n.Priority })
            .Take(300)
            .ToListAsync();

        // Names that start with the first word come first, then shorter names.
        var first = words[0];
        var best = hits
            .OrderBy(h => h.Name.StartsWith(first, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenBy(h => h.Priority == 1 ? 0 : 1)
            .ThenBy(h => h.Name.Length)
            .GroupBy(h => h.FoodId)
            .Select(g => g.First())
            .Take(MaxResults)
            .ToList();

        var ids = best.Select(b => b.FoodId).ToArray();
        var portions = await db.FoodPortions.AsNoTracking()
            .Where(p => ids.Contains(p.FoodId))
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.Id)
            .ToListAsync();
        var values = await db.FoodValues.AsNoTracking()
            .Where(v => ids.Contains(v.FoodId))
            .ToDictionaryAsync(v => v.FoodId);
        var foods = await db.Foods.AsNoTracking()
            .Where(f => ids.Contains(f.Id))
            .ToDictionaryAsync(f => f.Id);

        Response.Headers.CacheControl = "no-store";
        return Ok(best.Select(b =>
        {
            var portion = portions.FirstOrDefault(p => p.FoodId == b.FoodId);
            var value = values.GetValueOrDefault(b.FoodId);
            return new
            {
                id = b.FoodId,
                name = b.Name,
                category = foods.TryGetValue(b.FoodId, out var f) ? f.Categories.FirstOrDefault(c => c != "recipe_ingredients") : null,
                portion = portion?.Description,
                portionGrams = portion?.Grams,
                kcal = portion is not null && value is not null ? Math.Round(value.Kcal * portion.Grams / 100m, 0) : (decimal?)null
            };
        }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        if (await SuperTrackerAccess.IsGuestAsync(accounts, CurrentUserId)) return SuperTrackerAccess.AccountRequired();

        var food = await db.Foods.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id);
        var value = await db.FoodValues.AsNoTracking().FirstOrDefaultAsync(v => v.FoodId == id);
        if (food is null || value is null) return NotFound();

        var portions = await db.FoodPortions.AsNoTracking()
            .Where(p => p.FoodId == id)
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.Id)
            .ToListAsync();

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            id = food.Id,
            name = food.Name,
            categories = food.Categories,
            portions = portions.Select(p => new
            {
                id = p.Id,
                description = p.Description,
                grams = p.Grams,
                increment = p.Increment,
                isDefault = p.IsDefault
            }),
            per100g = FoodAmounts.For(value, 100m)
        });
    }

    // Postgres LIKE treats backslash as the escape character.
    private static string EscapeLike(string text) =>
        text.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}