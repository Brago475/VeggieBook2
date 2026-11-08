namespace VeggieBook.Api.Playlists;

// The four meal labels. See db/migrations/024_meal_labels.sql.

public sealed record Meal(string Key, string En, string Es, string IdeasEn, string IdeasEs);

public static class Meals
{
    public static readonly IReadOnlyList<Meal> All =
    [
        new("breakfast", "Breakfast", "Desayuno", "Breakfast ideas", "Ideas para el desayuno"),
        new("lunch", "Lunch", "Almuerzo", "Lunch ideas", "Ideas para el almuerzo"),
        new("dinner", "Dinner", "Cena", "Dinner ideas", "Ideas para la cena"),
        new("snack", "Snack", "Bocadillo", "Snack ideas", "Ideas para bocadillos")
    ];

    public static Meal? Find(string? key) => All.FirstOrDefault(m => m.Key == key);

    public static bool IsKnown(string? key) => Find(key) is not null;

    // Keys in the standard order: breakfast, lunch, dinner, snack.
    public static List<string> Ordered(IEnumerable<string> keys)
    {
        var set = keys.ToHashSet();
        return All.Where(m => set.Contains(m.Key)).Select(m => m.Key).ToList();
    }

    // "Lunch and Dinner", "Breakfast, Lunch and Snack", or "none".
    public static string Names(IReadOnlyList<string> keys)
    {
        var names = keys.Select(k => Find(k)?.En ?? k).ToList();
        return names.Count switch
        {
            0 => "none",
            1 => names[0],
            _ => string.Join(", ", names.Take(names.Count - 1)) + " and " + names[^1]
        };
    }

    // "Snack ideas with zucchini" / "Ideas para bocadillos con calabacín".
    public static (string En, string Es) PlaylistNames(Meal meal, string vegetableEn, string vegetableEs) =>
        ($"{meal.IdeasEn} with {vegetableEn.ToLowerInvariant()}",
         $"{meal.IdeasEs} con {vegetableEs.ToLowerInvariant()}");
}