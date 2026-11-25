namespace VeggieBook.Api.SuperTracker;

// My Combo tables. See db/migrations/038 and 039.

public sealed class St2Combo
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? RemovedAt { get; set; }
    public List<St2ComboItem> Items { get; set; } = [];
}

// Either FoodId or CustomFoodId is set, never both.
public sealed class St2ComboItem
{
    public long Id { get; set; }
    public long ComboId { get; set; }
    public short Position { get; set; }
    public int? FoodId { get; set; }
    public long? CustomFoodId { get; set; }
    public string? VegetableKey { get; set; }
    public string Portion { get; set; } = "";
    public decimal Quantity { get; set; }
    public decimal Grams { get; set; }
}