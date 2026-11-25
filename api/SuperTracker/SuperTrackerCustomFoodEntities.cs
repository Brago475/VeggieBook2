namespace VeggieBook.Api.SuperTracker;

// Create My Food. See db/migrations/039. Values are per serving.

public sealed class St2CustomFood
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = "";
    public string Serving { get; set; } = "";
    public decimal? ServingGrams { get; set; }
    public decimal Kcal { get; set; }
    public decimal ProteinG { get; set; }
    public decimal SatFatG { get; set; }
    public decimal SodiumMg { get; set; }
    public decimal AddedSugarG { get; set; }
    public decimal FiberG { get; set; }
    public decimal Vegetables { get; set; }
    public decimal Fruits { get; set; }
    public decimal Dairy { get; set; }
    public decimal WholeGrains { get; set; }
    public decimal HealthyFats { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? RemovedAt { get; set; }
}