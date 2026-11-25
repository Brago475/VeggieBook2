namespace VeggieBook.Api.SuperTracker;

// Limits for Create My Food. They match the CHECK rules in
// db/migrations/039_supertracker_custom_foods.sql.

public record CustomFoodRequest(
    string? Name,
    string? Serving,
    decimal? ServingGrams,
    decimal? Kcal,
    decimal? ProteinG,
    decimal? SatFatG,
    decimal? SodiumMg,
    decimal? AddedSugarG,
    decimal? FiberG,
    decimal? Vegetables,
    decimal? Fruits,
    decimal? Dairy,
    decimal? WholeGrains,
    decimal? HealthyFats);

public static class CustomFoodRules
{
    public const int MaxPerUser = 200;

    // Returns the first field that fails, or null when all are valid.
    public static string? InvalidField(CustomFoodRequest r)
    {
        var name = (r.Name ?? "").Trim();
        if (name.Length is < 1 or > 80) return "name";
        var serving = (r.Serving ?? "").Trim();
        if (serving.Length is < 1 or > 40) return "serving";
        if (r.ServingGrams is decimal g && (g <= 0 || g > 5000)) return "servingGrams";
        if (r.Kcal is not decimal kcal || kcal < 0 || kcal > 5000) return "kcal";
        if (!InRange(r.ProteinG, 500)) return "proteinG";
        if (!InRange(r.SatFatG, 500)) return "satFatG";
        if (!InRange(r.SodiumMg, 20000)) return "sodiumMg";
        if (!InRange(r.AddedSugarG, 500)) return "addedSugarG";
        if (!InRange(r.FiberG, 200)) return "fiberG";
        if (!InRange(r.Vegetables, 10)) return "vegetables";
        if (!InRange(r.Fruits, 10)) return "fruits";
        if (!InRange(r.Dairy, 10)) return "dairy";
        if (!InRange(r.WholeGrains, 10)) return "wholeGrains";
        if (!InRange(r.HealthyFats, 10)) return "healthyFats";
        return null;
    }

    public static void Apply(St2CustomFood food, CustomFoodRequest r)
    {
        food.Name = r.Name!.Trim();
        food.Serving = r.Serving!.Trim();
        food.ServingGrams = r.ServingGrams is decimal g ? Math.Round(g, 1) : null;
        food.Kcal = Math.Round(r.Kcal!.Value, 1);
        food.ProteinG = Math.Round(r.ProteinG ?? 0, 1);
        food.SatFatG = Math.Round(r.SatFatG ?? 0, 1);
        food.SodiumMg = Math.Round(r.SodiumMg ?? 0, 1);
        food.AddedSugarG = Math.Round(r.AddedSugarG ?? 0, 1);
        food.FiberG = Math.Round(r.FiberG ?? 0, 1);
        food.Vegetables = Math.Round(r.Vegetables ?? 0, 2);
        food.Fruits = Math.Round(r.Fruits ?? 0, 2);
        food.Dairy = Math.Round(r.Dairy ?? 0, 2);
        food.WholeGrains = Math.Round(r.WholeGrains ?? 0, 2);
        food.HealthyFats = Math.Round(r.HealthyFats ?? 0, 2);
    }

    private static bool InRange(decimal? value, decimal max) => value is null || (value >= 0 && value <= max);
}