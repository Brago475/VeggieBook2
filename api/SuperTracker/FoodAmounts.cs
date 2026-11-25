namespace VeggieBook.Api.SuperTracker;

// Amounts for one food entry or a whole day. Servings follow the Dietary
// Guidelines, 2025-2030: vegetables, fruits and dairy in cups, whole grains
// in ounce equivalents, healthy fats in teaspoons of oil.

public sealed record FoodAmount(
    decimal Kcal,
    decimal Vegetables,
    decimal Fruits,
    decimal Dairy,
    decimal WholeGrains,
    decimal HealthyFats,
    decimal ProteinG,
    decimal SodiumMg,
    decimal SatFatG,
    decimal AddedSugarG,
    decimal FiberG,
    decimal PotassiumMg,
    decimal VitaminCMg)
{
    public static readonly FoodAmount Zero = new(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    // A USDA food: per-100 g values times grams / 100.
    public static FoodAmount FromValue(St2FoodValue v, decimal grams)
    {
        var k = grams / 100m;
        return new FoodAmount(
            v.Kcal * k, v.VegTotal * k, v.FruitTotal * k, v.DairyTotal * k, v.GrainWhole * k, v.OilsTsp * k,
            v.ProteinG * k, v.SodiumMg * k, v.SatFatG * k, v.AddedSugarG * k, v.FiberG * k,
            v.PotassiumMg * k, v.VitaminCMg * k);
    }

    // A custom food: per-serving values times servings. Potassium and
    // vitamin C are not asked for, so they count as zero.
    public static FoodAmount FromCustom(St2CustomFood c, decimal servings) =>
        new(
            c.Kcal * servings, c.Vegetables * servings, c.Fruits * servings, c.Dairy * servings,
            c.WholeGrains * servings, c.HealthyFats * servings, c.ProteinG * servings, c.SodiumMg * servings,
            c.SatFatG * servings, c.AddedSugarG * servings, c.FiberG * servings, 0m, 0m);

    public FoodAmount Plus(FoodAmount o) =>
        new(
            Kcal + o.Kcal, Vegetables + o.Vegetables, Fruits + o.Fruits, Dairy + o.Dairy,
            WholeGrains + o.WholeGrains, HealthyFats + o.HealthyFats, ProteinG + o.ProteinG,
            SodiumMg + o.SodiumMg, SatFatG + o.SatFatG, AddedSugarG + o.AddedSugarG, FiberG + o.FiberG,
            PotassiumMg + o.PotassiumMg, VitaminCMg + o.VitaminCMg);

    public FoodAmount Rounded() =>
        new(
            Math.Round(Kcal, 0), Math.Round(Vegetables, 2), Math.Round(Fruits, 2), Math.Round(Dairy, 2),
            Math.Round(WholeGrains, 2), Math.Round(HealthyFats, 2), Math.Round(ProteinG, 1),
            Math.Round(SodiumMg, 0), Math.Round(SatFatG, 1), Math.Round(AddedSugarG, 1), Math.Round(FiberG, 1),
            Math.Round(PotassiumMg, 0), Math.Round(VitaminCMg, 0));
}

public static class FoodAmounts
{
    public static FoodAmount For(St2FoodValue v, decimal grams) => FoodAmount.FromValue(v, grams).Rounded();
}