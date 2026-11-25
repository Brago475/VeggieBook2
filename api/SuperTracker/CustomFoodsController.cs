using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.SuperTracker;

// Create My Food: the signed-in account's own foods, counted by servings.
//
//   GET    /api/supertracker/custom-foods                 the account's foods
//   POST   /api/supertracker/custom-foods                 create
//   PUT    /api/supertracker/custom-foods/{id}            edit
//   DELETE /api/supertracker/custom-foods/{id}            hides the food (removed_at)
//   POST   /api/supertracker/days/{yyyy-MM-dd}/custom     { customFoodId, quantity, meal }
//
// Editing a food changes past days that used it, as in the original. Foods
// are never erased, so removed foods still show on past days.

public record AddCustomRequest(long? CustomFoodId, decimal? Quantity, string? Meal);

[ApiController]
[Route("api/supertracker/custom-foods")]
[Authorize]
public class CustomFoodsController(SuperTrackerContext db, AccountsContext accounts) : ControllerBase
{
    private Guid CurrentUserId =>
        AuthSetup.UserId(User) ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var foods = await db.CustomFoods.AsNoTracking()
            .Where(c => c.UserId == uid && c.RemovedAt == null)
            .OrderBy(c => c.Name)
            .ToListAsync();

        Response.Headers.CacheControl = "no-store";
        return Ok(foods.Select(View));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomFoodRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (CustomFoodRules.InvalidField(req) is string field)
            return BadRequest(new { error = "Please check this food's details.", code = "invalidCustomFood", field });

        var count = await db.CustomFoods.CountAsync(c => c.UserId == uid && c.RemovedAt == null);
        if (count >= CustomFoodRules.MaxPerUser)
            return BadRequest(new { error = "You can keep up to 200 of your own foods.", code = "tooManyFoods" });

        var now = DateTime.UtcNow;
        var food = new St2CustomFood { UserId = uid, CreatedAt = now, UpdatedAt = now };
        CustomFoodRules.Apply(food, req);
        db.CustomFoods.Add(food);
        await db.SaveChangesAsync();

        return Ok(View(food));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] CustomFoodRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (CustomFoodRules.InvalidField(req) is string field)
            return BadRequest(new { error = "Please check this food's details.", code = "invalidCustomFood", field });

        var food = await db.CustomFoods.FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid && c.RemovedAt == null);
        if (food is null) return NotFound();

        CustomFoodRules.Apply(food, req);
        food.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(View(food));
    }

    // Hides the food. The row is kept, so past days still show it.
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Remove(long id)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var food = await db.CustomFoods.FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid && c.RemovedAt == null);
        if (food is null) return NotFound();

        food.RemovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("/api/supertracker/days/{date}/custom")]
    public async Task<IActionResult> AddToDay(string date, [FromBody] AddCustomRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!St2Dates.TryDay(date, out var day))
            return BadRequest(new { error = "That date can't be used.", code = "invalidDate" });
        if (req.Meal is null || !FoodLogController.Meals.Contains(req.Meal))
            return BadRequest(new { error = "Choose a meal.", code = "invalidMeal" });
        if (req.Quantity is not decimal qty || qty < FoodLogController.MinQuantity || qty > FoodLogController.MaxQuantity)
            return BadRequest(new { error = "Choose an amount from 0.1 to 50.", code = "invalidAmount" });

        var food = await db.CustomFoods.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == req.CustomFoodId && c.UserId == uid && c.RemovedAt == null);
        if (food is null) return NotFound();

        var entry = new St2FoodEntry
        {
            UserId = uid,
            EatenOn = day,
            Meal = req.Meal,
            CustomFoodId = food.Id,
            Portion = food.Serving,
            Quantity = Math.Round(qty, 2),
            Grams = Math.Max(0.01m, Math.Round((food.ServingGrams ?? 1m) * qty, 2)),
            CreatedAt = DateTime.UtcNow
        };
        db.FoodEntries.Add(entry);
        await db.SaveChangesAsync();

        return Ok(new { id = entry.Id });
    }

    private static object View(St2CustomFood c) => new
    {
        id = c.Id,
        name = c.Name,
        serving = c.Serving,
        servingGrams = c.ServingGrams,
        kcal = c.Kcal,
        proteinG = c.ProteinG,
        satFatG = c.SatFatG,
        sodiumMg = c.SodiumMg,
        addedSugarG = c.AddedSugarG,
        fiberG = c.FiberG,
        vegetables = c.Vegetables,
        fruits = c.Fruits,
        dairy = c.Dairy,
        wholeGrains = c.WholeGrains,
        healthyFats = c.HealthyFats
    };
}