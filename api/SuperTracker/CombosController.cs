using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.SuperTracker;

// My Combo: a saved group of foods for the signed-in account.
//
//   GET    /api/supertracker/combos                       the account's combos
//   POST   /api/supertracker/combos/from-meal             { date, meal, name }
//   POST   /api/supertracker/combos/{id}/add              { date, meal }
//   DELETE /api/supertracker/combos/{id}                  hides the combo (removed_at)
//
// Combos are never erased.

public record ComboFromMealRequest(string? Date, string? Meal, string? Name);

public record AddComboRequest(string? Date, string? Meal);

[ApiController]
[Route("api/supertracker/combos")]
[Authorize]
public class CombosController(SuperTrackerContext db, AccountsContext accounts) : ControllerBase
{
    private const int MaxName = 60;
    private const int MaxCombos = 50;

    private Guid CurrentUserId =>
        AuthSetup.UserId(User) ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var combos = await db.Combos.AsNoTracking()
            .Where(c => c.UserId == uid && c.RemovedAt == null)
            .Include(c => c.Items)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var foodIds = combos.SelectMany(c => c.Items).Select(i => i.FoodId).Distinct().ToArray();
        var values = await db.FoodValues.AsNoTracking()
            .Where(v => foodIds.Contains(v.FoodId))
            .ToDictionaryAsync(v => v.FoodId);
        var names = await db.Foods.AsNoTracking()
            .Where(f => foodIds.Contains(f.Id))
            .ToDictionaryAsync(f => f.Id, f => f.Name);

        Response.Headers.CacheControl = "no-store";
        return Ok(combos.Select(c => new
        {
            id = c.Id,
            name = c.Name,
            itemCount = c.Items.Count,
            kcal = Math.Round(c.Items.Sum(i =>
                values.TryGetValue(i.FoodId, out var v) ? v.Kcal * i.Grams / 100m : 0m), 0),
            items = c.Items.OrderBy(i => i.Position).Select(i => names.GetValueOrDefault(i.FoodId, ""))
        }));
    }

    [HttpPost("from-meal")]
    public async Task<IActionResult> FromMeal([FromBody] ComboFromMealRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!St2Dates.TryDay(req.Date, out var day))
            return BadRequest(new { error = "That date can't be used.", code = "invalidDate" });
        if (req.Meal is null || !FoodLogController.Meals.Contains(req.Meal))
            return BadRequest(new { error = "Choose a meal.", code = "invalidMeal" });

        var name = (req.Name ?? "").Trim();
        if (name.Length == 0 || name.Length > MaxName)
            return BadRequest(new { error = "Give the combo a name of up to 60 characters.", code = "invalidName" });

        var count = await db.Combos.CountAsync(c => c.UserId == uid && c.RemovedAt == null);
        if (count >= MaxCombos)
            return BadRequest(new { error = "You can keep up to 50 combos.", code = "tooManyCombos" });

        var entries = await db.FoodEntries.AsNoTracking()
            .Where(e => e.UserId == uid && e.EatenOn == day && e.Meal == req.Meal)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();
        if (entries.Count == 0)
            return BadRequest(new { error = "This meal has no foods to save.", code = "emptyMeal" });

        var combo = new St2Combo { UserId = uid, Name = name, CreatedAt = DateTime.UtcNow };
        short position = 0;
        foreach (var e in entries)
        {
            combo.Items.Add(new St2ComboItem
            {
                Position = position++,
                FoodId = e.FoodId,
                VegetableKey = e.VegetableKey,
                Portion = e.Portion,
                Quantity = e.Quantity,
                Grams = e.Grams
            });
        }
        db.Combos.Add(combo);
        await db.SaveChangesAsync();

        return Ok(new { id = combo.Id });
    }

    [HttpPost("{id:long}/add")]
    public async Task<IActionResult> Add(long id, [FromBody] AddComboRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!St2Dates.TryDay(req.Date, out var day))
            return BadRequest(new { error = "That date can't be used.", code = "invalidDate" });
        if (req.Meal is null || !FoodLogController.Meals.Contains(req.Meal))
            return BadRequest(new { error = "Choose a meal.", code = "invalidMeal" });

        var combo = await db.Combos.AsNoTracking()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid && c.RemovedAt == null);
        if (combo is null) return NotFound();

        var now = DateTime.UtcNow;
        foreach (var i in combo.Items.OrderBy(i => i.Position))
        {
            db.FoodEntries.Add(new St2FoodEntry
            {
                UserId = uid,
                EatenOn = day,
                Meal = req.Meal,
                FoodId = i.FoodId,
                VegetableKey = i.VegetableKey,
                Portion = i.Portion,
                Quantity = i.Quantity,
                Grams = i.Grams,
                CreatedAt = now
            });
        }
        await db.SaveChangesAsync();

        return Ok(new { added = combo.Items.Count });
    }

    // Hides the combo. The rows are kept.
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Remove(long id)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var combo = await db.Combos.FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid && c.RemovedAt == null);
        if (combo is null) return NotFound();

        combo.RemovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }
}