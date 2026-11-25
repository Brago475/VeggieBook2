namespace VeggieBook.Api.SuperTracker;

// Daily servings by calorie level, from the Dietary Guidelines for
// Americans, 2025-2030 ("Daily Servings by Calorie Level", realfood.gov).
// Levels 1,600 to 3,200 match the SuperTracker System_Defined_Plans brackets
// for adults. Single values have Min equal to Max.

public readonly record struct ServingRange(decimal Min, decimal Max)
{
    public static ServingRange Of(decimal value) => new(value, value);
}

public sealed record ServingsRow(
    int Level,
    ServingRange Protein,
    ServingRange Dairy,
    ServingRange Vegetables,
    ServingRange Fruits,
    ServingRange WholeGrains,
    ServingRange HealthyFats);

public static class DailyServings
{
    private static ServingRange R(decimal min, decimal max) => new(min, max);
    private static ServingRange V(decimal value) => ServingRange.Of(value);

    public static readonly ServingsRow[] Rows =
    [
        new(1600, R(2.5m, 3.5m), V(3), V(2.5m),  V(1.5m), R(1.75m, 3.25m), V(3.5m)),
        new(1800, R(2.5m, 3.5m), V(3), V(3),     V(1.5m), R(2m, 4m),       V(4)),
        new(2000, R(3m, 4m),     V(3), V(3),     V(2),    R(2m, 4m),       V(4.5m)),
        new(2200, R(3.5m, 4.5m), V(3), V(3.5m),  V(2),    R(2.25m, 4.5m),  V(4.5m)),
        new(2400, R(3.5m, 4.5m), V(3), V(3.5m),  V(2),    R(2.75m, 5.25m), V(5)),
        new(2600, R(3.5m, 4.5m), V(3), V(4.25m), V(2),    R(3m, 6m),       V(5.5m)),
        new(2800, R(4m, 5m),     V(3), V(4.25m), V(2.5m), R(3.25m, 6.5m),  V(6)),
        new(3000, R(4m, 5m),     V(3), V(4.75m), V(2.5m), R(3.25m, 6.5m),  V(7)),
        new(3200, R(4m, 5m),     V(3), V(4.75m), V(2.5m), R(3.25m, 6.5m),  V(8)),
    ];

    // SuperTracker brackets: 1,600 covers up to 1,700; each level after
    // covers 101 below to 100 above it; 3,200 covers 3,101 and up.
    public static ServingsRow ForCalories(int calories)
    {
        foreach (var row in Rows)
        {
            if (row.Level == 3200 || calories <= row.Level + 100) return row;
        }
        return Rows[^1];
    }
}