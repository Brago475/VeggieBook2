namespace VeggieBook.Api.SuperTracker;

// SuperTracker2 tables. See db/migrations/032_supertracker.sql.

public sealed class St2Profile
{
    public Guid UserId { get; set; }
    public short Age { get; set; }
    public string Sex { get; set; } = "";
    public decimal HeightCm { get; set; }
    public decimal WeightKg { get; set; }
    public string Activity { get; set; } = "";
    public string Units { get; set; } = "us";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class St2TermsAcceptance
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public string Version { get; set; } = "";
    public DateTime AcceptedAt { get; set; }
}