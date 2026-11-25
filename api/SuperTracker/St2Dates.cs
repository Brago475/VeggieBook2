using System.Globalization;

namespace VeggieBook.Api.SuperTracker;

// Calendar days sent by the app, as yyyy-MM-dd: within the last 400 days,
// or tomorrow at most (time zones).

public static class St2Dates
{
    public static bool TryDay(string? text, out DateOnly day)
    {
        if (!DateOnly.TryParseExact(text ?? "", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out day))
            return false;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return day >= today.AddDays(-400) && day <= today.AddDays(1);
    }
}