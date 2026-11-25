namespace VeggieBook.Api.SuperTracker;

// Totals for one day of food entries. Every amount is the food's per-100 g
// value times grams / 100. Servings follow the Dietary Guidelines,
// 2025-2030: vegetables, fruits and dairy in cups, whole grains in ounce
// equivalents, healthy fats in teaspoons of oil.

public sealed record DayTotals(
    decimal Vegetables,
    decimal Fruits,
    decimal Dairy,
    decimal WholeGrains,
    decimal HealthyFats,
    decimal ProteinG,
    decimal Kcal,
    decimal SodiumMg,
    decimal SatFatG,
    decimal FiberG,
    decimal PotassiumMg,
    decimal VitaminCMg)
{
    public static DayTotals Sum(IEnumerable<(decimal Grams, St2FoodValue Value)> items)
    {
        decimal veg = 0, fruit = 0, dairy = 0, grains = 0, fats = 0, protein = 0;
        decimal kcal = 0, sodium = 0, satFat = 0, fiber = 0, potassium = 0, vitC = 0;

        foreach (var (grams, v) in items)
        {
            var k = grams / 100m;
            veg += v.VegTotal * k;
            fruit += v.FruitTotal * k;
            dairy += v.DairyTotal * k;
            grains += v.GrainWhole * k;
            fats += v.OilsTsp * k;
            protein += v.ProteinG * k;
            kcal += v.Kcal * k;
            sodium += v.SodiumMg * k;
            satFat += v.SatFatG * k;
            fiber += v.FiberG * k;
            potassium += v.PotassiumMg * k;
            vitC += v.VitaminCMg * k;
        }

        return new DayTotals(
            R(veg), R(fruit), R(dairy), R(grains), R(fats), R(protein),
            R(kcal), R(sodium), R(satFat), R(fiber), R(potassium), R(vitC));
    }

    private static decimal R(decimal x) => Math.Round(x, 2);
}