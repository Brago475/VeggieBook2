using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.SuperTracker;

// SuperTracker2 food search, details, recent foods and favorites, from the
// USDA SuperTracker foods database. Food names are in English only.
//
//   GET /api/supertracker/foods/search?q=&category=   up to 30 matches
//   GET /api/supertracker/foods/recent                 the account's last 15 foods
//   GET /api/supertracker/foods/favorites              the account's starred foods
//   GET /api/supertracker/foods/{id}                   portions, per-100 g amounts, favorite
//   PUT /api/supertracker/foods/{id}/favorite          { on }
//
// Un-starring sets removed_at; favorite rows are never deleted.

public record FavoriteRequest(bool On);

[ApiController]
[Route("api/supertracker/foods")]
[Authorize]
public class FoodsController(SuperTrackerContext db, AccountsContext accounts) : ControllerBase
{
    private const int MaxResults = 30;
    private const int MaxRecent = 15;

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
        if (words.Length == 0 || words.Sum(w => w.Length) < 2) return Ok(Array.Empty<FoodHit>());

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

        var found = await names
            .OrderBy(n => n.Priority)
            .Select(n => new { n.FoodId, n.Name, n.Priority })
            .Take(300)
            .ToListAsync();

        // Names that start with the first word come first, then shorter names.
        var first = words[0];
        var best = found
            .OrderBy(h => h.Name.StartsWith(first, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenBy(h => h.Priority == 1 ? 0 : 1)
            .ThenBy(h => h.Name.Length)
            .GroupBy(h => h.FoodId)
            .Select(g => g.First())
            .Take(MaxResults)
            .Select(h => (h.FoodId, (string?)h.Name))
            .ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(await FoodHits.BuildAsync(db, best));
    }

    [HttpGet("recent")]
    public async Task<IActionResult> Recent()
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var latest = await db.FoodEntries.AsNoTracking()
            .Where(e => e.UserId == uid && e.VegetableKey == null)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => e.FoodId)
            .Take(200)
            .ToListAsync();

        var items = latest.Distinct().Take(MaxRecent).Select(id => (id, (string?)null)).ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(await FoodHits.BuildAsync(db, items));
    }

    [HttpGet("favorites")]
    public async Task<IActionResult> Favorites()
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var ids = await db.FavoriteFoods.AsNoTracking()
            .Where(f => f.UserId == uid && f.RemovedAt == null)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => f.FoodId)
            .ToListAsync();

        Response.Headers.CacheControl = "no-store";
        return Ok(await FoodHits.BuildAsync(db, ids.Select(id => (id, (string?)null)).ToList()));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var food = await db.Foods.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id);
        var value = await db.FoodValues.AsNoTracking().FirstOrDefaultAsync(v => v.FoodId == id);
        if (food is null || value is null) return NotFound();

        var portions = await db.FoodPortions.AsNoTracking()
            .Where(p => p.FoodId == id)
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.Id)
            .ToListAsync();
        var favorite = await db.FavoriteFoods.AsNoTracking()
            .AnyAsync(f => f.UserId == uid && f.FoodId == id && f.RemovedAt == null);

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            id = food.Id,
            name = food.Name,
            categories = food.Categories,
            isFavorite = favorite,
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

    [HttpPut("{id:int}/favorite")]
    public async Task<IActionResult> SetFavorite(int id, [FromBody] FavoriteRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!await db.Foods.AnyAsync(f => f.Id == id)) return NotFound();

        var row = await db.FavoriteFoods.FirstOrDefaultAsync(f => f.UserId == uid && f.FoodId == id);
        var now = DateTime.UtcNow;

        if (row is null)
        {
            if (req.On)
            {
                db.FavoriteFoods.Add(new St2FavoriteFood { UserId = uid, FoodId = id, CreatedAt = now });
            }
        }
        else if (req.On && row.RemovedAt is not null)
        {
            row.RemovedAt = null;
            row.CreatedAt = now;
        }
        else if (!req.On && row.RemovedAt is null)
        {
            row.RemovedAt = now;
        }

        await db.SaveChangesAsync();
        return Ok(new { isFavorite = req.On });
    }

    // Postgres LIKE treats backslash as the escape character.
    private static string EscapeLike(string text) =>
        text.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}