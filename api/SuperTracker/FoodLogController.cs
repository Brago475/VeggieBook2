using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.SuperTracker;

// SuperTracker2 food log for the signed-in account. Not research tracked.
//
//   GET    /api/supertracker/vegetables?lang=                VeggieBook vegetables with per-cup amounts
//   GET    /api/supertracker/days/{yyyy-MM-dd}?lang=         one day's entries and totals
//   POST   /api/supertracker/days/{yyyy-MM-dd}/foods         { foodId, portionId, quantity, meal }
//   POST   /api/supertracker/days/{yyyy-MM-dd}/vegetables    { key, cups, meal }
//   POST   /api/supertracker/days/{yyyy-MM-dd}/copy          { fromDate, meal }
//   PUT    /api/supertracker/entries/{id}                    { quantity, portionId, meal }
//   DELETE /api/supertracker/entries/{id}                    hides the entry (deleted_at)
//
// Custom foods are added through CustomFoodsController. Dates are the
// account's own calendar day, sent by the app. Every query is limited to
// the signed-in account. Entries are never erased.

public record AddFoodRequest(int? FoodId, int? PortionId, decimal? Quantity, string? Meal);

public record AddVegetableRequest(string? Key, decimal? Cups, string? Meal);

public record CopyMealRequest(string? FromDate, string? Meal);

public record EditEntryRequest(decimal? Quantity, int? PortionId, string? Meal);

[ApiController]
[Route("api/supertracker")]
[Authorize]
public class FoodLogController(SuperTrackerContext db, AccountsContext accounts) : ControllerBase
{
    public const decimal MinCups = 0.25m;
    public const decimal MaxCups = 10m;
    public const decimal MinQuantity = 0.1m;
    public const decimal MaxQuantity = 50m;

    public static readonly string[] Meals = ["breakfast", "lunch", "dinner", "snack"];

    private Guid CurrentUserId =>
        AuthSetup.UserId(User) ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet("vegetables")]
    public async Task<IActionResult> Vegetables([FromQuery] string? lang)
    {
        if (await SuperTrackerAccess.IsGuestAsync(accounts, CurrentUserId)) return SuperTrackerAccess.AccountRequired();
        var es = Lang.IsSpanish(lang);

        var rows = await (
                from g in db.Vegetables
                where g.Active
                join v in db.FoodValues on g.FoodId equals v.FoodId
                orderby g.Position
                select new { g, v })
            .AsNoTracking()
            .ToListAsync();

        Response.Headers.CacheControl = "no-store";
        return Ok(rows.Select(r => new
        {
            key = r.g.Key,
            vegetable = r.g.VegetableCode,
            name = es ? r.g.NameEs : r.g.NameEn,
            perCup = new
            {
                servings = Amount(r.v.VegTotal, r.g.CupGrams, 2),
                kcal = Amount(r.v.Kcal, r.g.CupGrams, 0),
                fiberG = Amount(r.v.FiberG, r.g.CupGrams, 1),
                vitaminCMg = Amount(r.v.VitaminCMg, r.g.CupGrams, 0),
                potassiumMg = Amount(r.v.PotassiumMg, r.g.CupGrams, 0)
            }
        }));
    }

    [HttpGet("days/{date}")]
    public async Task<IActionResult> Day(string date, [FromQuery] string? lang)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!St2Dates.TryDay(date, out var day)) return BadDate();

        var entries = await db.FoodEntries.AsNoTracking()
            .Where(e => e.UserId == uid && e.EatenOn == day)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();
        var lookup = await EntryLookup.LoadAsync(db, entries, Lang.IsSpanish(lang));
        var amounts = entries.Select(e => (e, amount: lookup.AmountOf(e))).ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            date = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            entries = amounts.Select(r => new
            {
                id = r.e.Id,
                foodId = r.e.FoodId,
                customFoodId = r.e.CustomFoodId,
                name = lookup.NameOf(r.e),
                vegetableKey = r.e.VegetableKey,
                meal = r.e.Meal,
                portion = r.e.Portion,
                quantity = r.e.Quantity,
                grams = r.e.Grams,
                amounts = r.amount.Rounded()
            }),
            totals = DayTotals.Sum(amounts.Select(r => r.amount))
        });
    }

    [HttpPost("days/{date}/foods")]
    public async Task<IActionResult> AddFood(string date, [FromBody] AddFoodRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!St2Dates.TryDay(date, out var day)) return BadDate();

        if (req.Meal is null || !Meals.Contains(req.Meal))
            return BadRequest(new { error = "Choose a meal.", code = "invalidMeal" });
        if (req.Quantity is not decimal qty || qty < MinQuantity || qty > MaxQuantity)
            return BadRequest(new { error = "Choose an amount from 0.1 to 50.", code = "invalidAmount" });

        var portion = await db.FoodPortions.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == req.PortionId && p.FoodId == req.FoodId);
        if (portion is null)
            return BadRequest(new { error = "Choose a food and portion.", code = "invalidFood" });

        var entry = new St2FoodEntry
        {
            UserId = uid,
            EatenOn = day,
            Meal = req.Meal,
            FoodId = portion.FoodId,
            Portion = portion.Description,
            Quantity = Math.Round(qty, 2),
            Grams = Math.Round(portion.Grams * qty, 2),
            CreatedAt = DateTime.UtcNow
        };
        db.FoodEntries.Add(entry);
        await db.SaveChangesAsync();

        return Ok(new { id = entry.Id });
    }

    [HttpPost("days/{date}/vegetables")]
    public async Task<IActionResult> AddVegetable(string date, [FromBody] AddVegetableRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!St2Dates.TryDay(date, out var day)) return BadDate();

        if (req.Cups is not decimal cups || cups < MinCups || cups > MaxCups)
            return BadRequest(new { error = "Choose an amount from ¼ cup to 10 cups.", code = "invalidAmount" });
        if (req.Meal is not null && !Meals.Contains(req.Meal))
            return BadRequest(new { error = "Choose a meal.", code = "invalidMeal" });

        var veg = await db.Vegetables.AsNoTracking().FirstOrDefaultAsync(g => g.Key == req.Key && g.Active);
        if (veg is null)
            return BadRequest(new { error = "Choose a vegetable.", code = "invalidVegetable" });

        var entry = new St2FoodEntry
        {
            UserId = uid,
            EatenOn = day,
            Meal = req.Meal,
            FoodId = veg.FoodId,
            VegetableKey = veg.Key,
            Portion = "cup",
            Quantity = Math.Round(cups, 2),
            Grams = Math.Round(veg.CupGrams * cups, 2),
            CreatedAt = DateTime.UtcNow
        };
        db.FoodEntries.Add(entry);
        await db.SaveChangesAsync();

        return Ok(new { id = entry.Id });
    }

    // Copies one meal's entries from another day into this day.
    [HttpPost("days/{date}/copy")]
    public async Task<IActionResult> CopyMeal(string date, [FromBody] CopyMealRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!St2Dates.TryDay(date, out var day) || !St2Dates.TryDay(req.FromDate, out var from) || from == day)
            return BadDate();
        if (req.Meal is null || !Meals.Contains(req.Meal))
            return BadRequest(new { error = "Choose a meal.", code = "invalidMeal" });

        var source = await db.FoodEntries.AsNoTracking()
            .Where(e => e.UserId == uid && e.EatenOn == from && e.Meal == req.Meal)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var e in source)
        {
            db.FoodEntries.Add(new St2FoodEntry
            {
                UserId = uid,
                EatenOn = day,
                Meal = e.Meal,
                FoodId = e.FoodId,
                CustomFoodId = e.CustomFoodId,
                VegetableKey = e.VegetableKey,
                Portion = e.Portion,
                Quantity = e.Quantity,
                Grams = e.Grams,
                CreatedAt = now
            });
        }
        await db.SaveChangesAsync();

        return Ok(new { copied = source.Count });
    }

    // Changes the amount, portion (USDA foods only) or meal of one entry.
    [HttpPut("entries/{id:long}")]
    public async Task<IActionResult> EditEntry(long id, [FromBody] EditEntryRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var entry = await db.FoodEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == uid);
        if (entry is null) return NotFound();

        var isVegetable = entry.VegetableKey is not null;
        var min = isVegetable ? MinCups : MinQuantity;
        var max = isVegetable ? MaxCups : MaxQuantity;
        if (req.Quantity is not decimal qty || qty < min || qty > max)
            return BadRequest(new { error = "Choose a different amount.", code = "invalidAmount" });

        if (req.Meal is null ? !isVegetable : !Meals.Contains(req.Meal))
            return BadRequest(new { error = "Choose a meal.", code = "invalidMeal" });

        qty = Math.Round(qty, 2);
        var perUnit = entry.Quantity > 0 ? entry.Grams / entry.Quantity : entry.Grams;

        if (entry.FoodId is int foodId && !isVegetable && req.PortionId is int portionId)
        {
            var portion = await db.FoodPortions.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == portionId && p.FoodId == foodId);
            if (portion is null)
                return BadRequest(new { error = "Choose a portion.", code = "invalidPortion" });
            entry.Portion = portion.Description;
            perUnit = portion.Grams;
        }

        entry.Quantity = qty;
        entry.Grams = Math.Max(0.01m, Math.Round(perUnit * qty, 2));
        entry.Meal = req.Meal;
        await db.SaveChangesAsync();

        return Ok(new { id = entry.Id });
    }

    // Hides one of the account's own entries. The row is kept.
    [HttpDelete("entries/{id:long}")]
    public async Task<IActionResult> DeleteEntry(long id)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var entry = await db.FoodEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == uid);
        if (entry is null) return NotFound();

        entry.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private BadRequestObjectResult BadDate() =>
        BadRequest(new { error = "That date can't be used.", code = "invalidDate" });

    private static decimal Amount(decimal per100, decimal grams, int decimals) =>
        Math.Round(per100 * grams / 100m, decimals);
}