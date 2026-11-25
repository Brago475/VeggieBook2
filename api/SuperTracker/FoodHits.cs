using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.SuperTracker;

// A food as shown in search, recent and favorites lists: name, main
// category, and calories for its default portion.

public sealed record FoodHit(
    int Id,
    string Name,
    string? Category,
    string? Portion,
    decimal? PortionGrams,
    decimal? Kcal);

public static class FoodHits
{
    // Builds hits in the given order. Name overrides the food's main name,
    // for search matches on another name.
    public static async Task<List<FoodHit>> BuildAsync(
        SuperTrackerContext db, IReadOnlyList<(int FoodId, string? Name)> items)
    {
        var ids = items.Select(i => i.FoodId).Distinct().ToArray();

        var foods = await db.Foods.AsNoTracking()
            .Where(f => ids.Contains(f.Id))
            .ToDictionaryAsync(f => f.Id);
        var values = await db.FoodValues.AsNoTracking()
            .Where(v => ids.Contains(v.FoodId))
            .ToDictionaryAsync(v => v.FoodId);
        var portions = await db.FoodPortions.AsNoTracking()
            .Where(p => ids.Contains(p.FoodId))
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.Id)
            .ToListAsync();

        var hits = new List<FoodHit>();
        foreach (var (foodId, name) in items)
        {
            if (!foods.TryGetValue(foodId, out var food)) continue;
            var portion = portions.FirstOrDefault(p => p.FoodId == foodId);
            var value = values.GetValueOrDefault(foodId);

            hits.Add(new FoodHit(
                foodId,
                name ?? food.Name,
                food.Categories.FirstOrDefault(c => c != "recipe_ingredients"),
                portion?.Description,
                portion?.Grams,
                portion is not null && value is not null
                    ? Math.Round(value.Kcal * portion.Grams / 100m, 0)
                    : null));
        }
        return hits;
    }
}