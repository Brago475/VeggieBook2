using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// Who and what the research side of the admin site may count, in one place:
// the Overview, Question Analytics, the research sheets, and All Data all
// follow it, so no page can count something another page leaves out.
//
//   A book     counts only if the person's tracking was on at the moment
//              they saved it. Books saved while it was off are never
//              counted, even after they turn it back on. Books saved
//              before they turned it off still count.
//   A person   counts (in people totals, age ranges, and sign-ups) only
//              while their tracking is on right now. Someone who turned it
//              off disappears from those numbers until they turn it on.
//
// Admins and guests are left out before this is even asked (see
// StudyTracking.PeopleAsync). Turned off by the person or by an admin makes
// no difference here. Nothing is deleted: people still see all their own
// books in the app.

public sealed class ResearchScope
{
    private readonly TrackingHistory history;
    private readonly DateTime now;

    private ResearchScope(TrackingHistory history, DateTime now)
    {
        this.history = history;
        this.now = now;
    }

    public static async Task<ResearchScope> LoadAsync(AccountsContext db) =>
        new(await TrackingHistory.LoadAsync(db), DateTime.UtcNow);

    // savedAt is the book's CreatedAt (UTC).
    public bool CountsBook(Guid userId, DateTime savedAt) => history.At(userId, savedAt).On;

    public bool CountsPerson(Guid userId) => history.At(userId, now).On;
}