namespace VeggieBook.Api.SuperTracker;

// Food tables. See db/migrations/034 and 035. Values are per 100 g.

public sealed class St2Food
{
    public int Id { get; set; }
    public int FoodCode { get; set; }
    public string Name { get; set; } = "";
}

public sealed class St2FoodValue
{
    public int FoodId { get; set; }
    public decimal VegTotal { get; set; }
    public decimal FruitTotal { get; set; }
    public decimal DairyTotal { get; set; }
    public decimal GrainWhole { get; set; }
    public decimal OilsTsp { get; set; }
    public decimal Kcal { get; set; }
    public decimal ProteinG { get; set; }
    public decimal SatFatG { get; set; }
    public decimal FiberG { get; set; }
    public decimal SodiumMg { get; set; }
    public decimal PotassiumMg { get; set; }
    public decimal VitaminCMg { get; set; }
}

public sealed class St2Vegetable
{
    public string Key { get; set; } = "";
    public string VegetableCode { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string NameEs { get; set; } = "";
    public int FoodId { get; set; }
    public decimal CupGrams { get; set; }
    public short Position { get; set; }
}

public sealed class St2FoodEntry
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly EatenOn { get; set; }
    public string? Meal { get; set; }
    public int FoodId { get; set; }
    public string? VegetableKey { get; set; }
    public string Portion { get; set; } = "";
    public decimal Quantity { get; set; }
    public decimal Grams { get; set; }
    public DateTime CreatedAt { get; set; }
}