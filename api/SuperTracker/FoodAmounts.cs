namespace VeggieBook.Api.SuperTracker;

// The same amounts DayTotals adds up, for a single food and weight.

public static class FoodAmounts
{
    public static object For(St2FoodValue v, decimal grams)
    {
        var k = grams / 100m;
        return new
        {
            kcal = Math.Round(v.Kcal * k, 0),
            vegetables = Math.Round(v.VegTotal * k, 2),
            fruits = Math.Round(v.FruitTotal * k, 2),
            dairy = Math.Round(v.DairyTotal * k, 2),
            wholeGrains = Math.Round(v.GrainWhole * k, 2),
            healthyFats = Math.Round(v.OilsTsp * k, 2),
            proteinG = Math.Round(v.ProteinG * k, 1),
            sodiumMg = Math.Round(v.SodiumMg * k, 0),
            satFatG = Math.Round(v.SatFatG * k, 1),
            addedSugarG = Math.Round(v.AddedSugarG * k, 1),
            fiberG = Math.Round(v.FiberG * k, 1),
            potassiumMg = Math.Round(v.PotassiumMg * k, 0),
            vitaminCMg = Math.Round(v.VitaminCMg * k, 0)
        };
    }
}