namespace VeggieBook.Api.SuperTracker;

// Totals for a set of food entries.

public static class DayTotals
{
    public static FoodAmount Sum(IEnumerable<FoodAmount> items) =>
        items.Aggregate(FoodAmount.Zero, (total, next) => total.Plus(next)).Rounded();
}