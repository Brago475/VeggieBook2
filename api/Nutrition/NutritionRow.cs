namespace VeggieBook.Api.Nutrition;

// One row of vegetable_nutrition (db/fixes/012_vegetable_nutrition.sql),
// read with a raw query. Property names match the column aliases.

public sealed class NutritionRow
{
    public string NameEn { get; set; } = "";
    public string NameEs { get; set; } = "";
    public string ServingEn { get; set; } = "";
    public string ServingEs { get; set; } = "";
    public decimal Grams { get; set; }
    public decimal Ounces { get; set; }
    public int Calories { get; set; }
    public int CaloriesFromFat { get; set; }
    public decimal FatG { get; set; }
    public int FatDv { get; set; }
    public int SodiumMg { get; set; }
    public int SodiumDv { get; set; }
    public int PotassiumMg { get; set; }
    public int PotassiumDv { get; set; }
    public int CarbsG { get; set; }
    public int CarbsDv { get; set; }
    public int FiberG { get; set; }
    public int FiberDv { get; set; }
    public int SugarsG { get; set; }
    public int ProteinG { get; set; }
    public int VitaminADv { get; set; }
    public int VitaminCDv { get; set; }
    public int CalciumDv { get; set; }
    public int IronDv { get; set; }
    public string Source { get; set; } = "";
    public string SourceUrl { get; set; } = "";
    public int Position { get; set; }
}