using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// Everyone's tracking changes, loaded once, so a request can ask "was this
// person's tracking on at this moment?" without going back to the database.
//
// A study only counts what happened while someone was tracked: a book saved
// while their tracking was off is left out, even if they turned it back on
// later. With no changes, an account has been on since it was made (the
// default).
//
// The study has hundreds of people at most, so every change is read.

public sealed class TrackingHistory
{
    private readonly Dictionary<Guid, List<TrackingChange>> byUser;

    private TrackingHistory(Dictionary<Guid, List<TrackingChange>> byUser)
    {
        this.byUser = byUser;
    }

    public static async Task<TrackingHistory> LoadAsync(AccountsContext db)
    {
        var all = await db.TrackingChanges.AsNoTracking().ToListAsync();

        return new TrackingHistory(all
            .GroupBy(c => c.UserId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(c => c.At).ThenBy(c => c.Id).ToList()));
    }

    // Every change for one person, oldest first (empty if they never
    // changed it, which means on since they joined).
    public IReadOnlyList<TrackingChange> ChangesOf(Guid userId) =>
        byUser.TryGetValue(userId, out var changes) ? changes : [];

    // The person's tracking at that moment: their latest change at or
    // before it, or on (the default) if there is none.
    public TrackingState At(Guid userId, DateTime when)
    {
        if (!byUser.TryGetValue(userId, out var changes)) return TrackingState.Default;

        TrackingChange? last = null;
        foreach (var change in changes)
        {
            if (change.At > when) break;
            last = change;
        }

        return last is null
            ? TrackingState.Default
            : new TrackingState(last.TrackingOn, last.ChangedBy, last.At);
    }
}