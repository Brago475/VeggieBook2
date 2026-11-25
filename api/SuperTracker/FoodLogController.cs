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
//   GET    /api/supertracker/vegetables?lang=           VeggieBook vegetables with per-cup amounts
//   GET    /api/supertracker/days/{yyyy-MM-dd}?lang=    one day's entries and totals
//   POST   /api/supertracker/days/{yyyy-MM-dd}/vegetables  { key, cups }
//   DELETE /api/supertracker/entries/{id}
//
// Dates are the account's own calendar day, sent by the app. Every query is
// limited to the signed-in account.

public record AddVegetableRequest(string? Key, decimal? Cups);

[ApiController]
[Route("api/supertracker")]
[Authorize]
public class FoodLogController(SuperTrackerContext db, AccountsContext accounts) : ControllerBase
{
    private const decimal MinCups = 0.25m;
    private const decimal MaxCups = 10m;

    private Guid CurrentUserId =>
        AuthSetup.UserId(User) ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet("vegetables")]
    public async Task<IActionResult> Vegetables([FromQuery] string? lang)
    {
        if (await SuperTrackerAccess.IsGuestAsync(accounts, CurrentUserId)) return SuperTrackerAccess.AccountRequired();
        var es = Lang.IsSpanish(lang);

        var rows = await (
                from g in db.Vegetables
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
        if (!TryDay(date, out var day)) return BadDate();
        var es = Lang.IsSpanish(lang);

        var rows = await (
                from e in db.FoodEntries
                where e.UserId == uid && e.EatenOn == day
                join f in db.Foods on e.FoodId equals f.Id
                join v in db.FoodValues on e.FoodId equals v.FoodId
                orderby e.CreatedAt
                select new { e, f.Name, v })
            .AsNoTracking()
            .ToListAsync();

        var names = await db.Vegetables.AsNoTracking()
            .ToDictionaryAsync(g => g.Key, g => es ? g.NameEs : g.NameEn);

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            date = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            entries = rows.Select(r => new
            {
                id = r.e.Id,
                name = r.e.VegetableKey is string key && names.TryGetValue(key, out var n) ? n : r.Name,
                vegetableKey = r.e.VegetableKey,
                portion = r.e.Portion,
                quantity = r.e.Quantity,
                vegetables = Amount(r.v.VegTotal, r.e.Grams, 2),
                kcal = Amount(r.v.Kcal, r.e.Grams, 0)
            }),
            totals = DayTotals.Sum(rows.Select(r => (r.e.Grams, r.v)))
        });
    }

    [HttpPost("days/{date}/vegetables")]
    public async Task<IActionResult> AddVegetable(string date, [FromBody] AddVegetableRequest req)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();
        if (!TryDay(date, out var day)) return BadDate();

        if (req.Cups is not decimal cups || cups < MinCups || cups > MaxCups)
            return BadRequest(new { error = "Choose an amount from ¼ cup to 10 cups.", code = "invalidAmount" });

        var veg = await db.Vegetables.AsNoTracking().FirstOrDefaultAsync(g => g.Key == req.Key);
        if (veg is null)
            return BadRequest(new { error = "Choose a vegetable.", code = "invalidVegetable" });

        var entry = new St2FoodEntry
        {
            UserId = uid,
            EatenOn = day,
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

    [HttpDelete("entries/{id:long}")]
    public async Task<IActionResult> DeleteEntry(long id)
    {
        var uid = CurrentUserId;
        if (await SuperTrackerAccess.IsGuestAsync(accounts, uid)) return SuperTrackerAccess.AccountRequired();

        var entry = await db.FoodEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == uid);
        if (entry is null) return NotFound();

        db.FoodEntries.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // A calendar day within the last 400 days, or tomorrow at most (time zones).
    private static bool TryDay(string text, out DateOnly day)
    {
        if (!DateOnly.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out day))
            return false;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return day >= today.AddDays(-400) && day <= today.AddDays(1);
    }

    private BadRequestObjectResult BadDate() =>
        BadRequest(new { error = "That date can't be used.", code = "invalidDate" });

    private static decimal Amount(decimal per100, decimal grams, int decimals) =>
        Math.Round(per100 * grams / 100m, decimals);
}