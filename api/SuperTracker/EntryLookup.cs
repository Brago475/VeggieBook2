using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.SuperTracker;

// Names and amounts for food entries, loaded once for a set of entries.
// Custom foods are found even after they are removed, so past days still
// show them.

public sealed class EntryLookup
{
    private readonly Dictionary<int, string> _foodNames;
    private readonly Dictionary<int, St2FoodValue> _values;
    private readonly Dictionary<long, St2CustomFood> _customs;
    private readonly Dictionary<string, string> _vegetableNames;

    private EntryLookup(
        Dictionary<int, string> foodNames,
        Dictionary<int, St2FoodValue> values,
        Dictionary<long, St2CustomFood> customs,
        Dictionary<string, string> vegetableNames)
    {
        _foodNames = foodNames;
        _values = values;
        _customs = customs;
        _vegetableNames = vegetableNames;
    }

    public static async Task<EntryLookup> LoadAsync(
        SuperTrackerContext db, IReadOnlyCollection<St2FoodEntry> entries, bool spanish)
    {
        var foodIds = entries.Where(e => e.FoodId != null).Select(e => e.FoodId!.Value).Distinct().ToArray();
        var customIds = entries.Where(e => e.CustomFoodId != null).Select(e => e.CustomFoodId!.Value).Distinct().ToArray();

        var names = await db.Foods.AsNoTracking()
            .Where(f => foodIds.Contains(f.Id))
            .ToDictionaryAsync(f => f.Id, f => f.Name);
        var values = await db.FoodValues.AsNoTracking()
            .Where(v => foodIds.Contains(v.FoodId))
            .ToDictionaryAsync(v => v.FoodId);
        var customs = await db.CustomFoods.AsNoTracking()
            .Where(c => customIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id);
        var vegetables = await db.Vegetables.AsNoTracking()
            .ToDictionaryAsync(g => g.Key, g => spanish ? g.NameEs : g.NameEn);

        return new EntryLookup(names, values, customs, vegetables);
    }

    public string NameOf(St2FoodEntry e)
    {
        if (e.VegetableKey is string key && _vegetableNames.TryGetValue(key, out var veg)) return veg;
        if (e.CustomFoodId is long cid && _customs.TryGetValue(cid, out var custom)) return custom.Name;
        if (e.FoodId is int fid && _foodNames.TryGetValue(fid, out var name)) return name;
        return "";
    }

    public FoodAmount AmountOf(St2FoodEntry e)
    {
        if (e.CustomFoodId is long cid && _customs.TryGetValue(cid, out var custom))
            return FoodAmount.FromCustom(custom, e.Quantity);
        if (e.FoodId is int fid && _values.TryGetValue(fid, out var value))
            return FoodAmount.FromValue(value, e.Grams);
        return FoodAmount.Zero;
    }
}