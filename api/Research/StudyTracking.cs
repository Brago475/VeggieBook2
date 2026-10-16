using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// The rules for studies and research tracking, in one place, so the admin
// endpoints and the app's own endpoints can't drift apart.
//
//   Who counts      real accounts that are not admins (the same people as
//                   the research sheets). Guests and admins never count.
//   Tracking        on by default from the moment an account accepts the
//                   Terms. Turned off or back on in Settings ("self"), or
//                   turned off by an admin ("admin"). The latest change
//                   wins; no changes means on.
//   Studies         nothing is recorded unless a study is running. Only one
//                   can run at a time (the database enforces it).
//   The notice      while a study runs, shown only to people who turned
//                   tracking off themselves, once per study. People an
//                   admin turned off never see it.
//
// See db/migrations/008_studies.sql.

public record TrackingState(bool On, string? ChangedBy, DateTime? ChangedAt)
{
    public static readonly TrackingState Default = new(true, null, null);

    public bool OffBySelf => !On && ChangedBy == "self";
    public bool OffByAdmin => !On && ChangedBy == "admin";
}

public static class StudyTracking
{
    // Real accounts that are not admins: everyone a study can include.
    public static async Task<IQueryable<AppUser>> PeopleAsync(AccountsContext db)
    {
        var adminRoleId = await AdminRoleIdAsync(db);
        return db.Users
            .AsNoTracking()
            .Where(u => u.GuestExpiresAt == null
                     && !db.UserRoles.Any(r => r.UserId == u.Id && r.RoleId == adminRoleId));
    }

    public static async Task<bool> IsAdminAsync(AccountsContext db, Guid userId)
    {
        var adminRoleId = await AdminRoleIdAsync(db);
        return await db.UserRoles.AnyAsync(r => r.UserId == userId && r.RoleId == adminRoleId);
    }

    // Everyone's current tracking, from their latest change. Accounts that
    // never changed it are missing here and are on (TrackingState.Default).
    // The study has hundreds of people at most, so this reads every change.
    public static async Task<Dictionary<Guid, TrackingState>> CurrentAsync(AccountsContext db)
    {
        var changes = await db.TrackingChanges
            .AsNoTracking()
            .Select(c => new { c.Id, c.UserId, c.TrackingOn, c.ChangedBy, c.At })
            .ToListAsync();

        return changes
            .GroupBy(c => c.UserId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var last = g.OrderBy(c => c.At).ThenBy(c => c.Id).Last();
                    return new TrackingState(last.TrackingOn, last.ChangedBy, last.At);
                });
    }

    public static async Task<TrackingState> ForUserAsync(AccountsContext db, Guid userId)
    {
        var last = await db.TrackingChanges
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.At)
            .ThenByDescending(c => c.Id)
            .FirstOrDefaultAsync();

        return last is null
            ? TrackingState.Default
            : new TrackingState(last.TrackingOn, last.ChangedBy, last.At);
    }

    public static TrackingState Of(Dictionary<Guid, TrackingState> states, Guid userId) =>
        states.TryGetValue(userId, out var s) ? s : TrackingState.Default;

    // Records a change, unless it changes nothing. Returns the new state.
    public static async Task<TrackingState> SetAsync(
        AccountsContext db,
        Guid userId,
        bool on,
        string changedBy,
        Guid? adminId = null)
    {
        var current = await ForUserAsync(db, userId);
        if (current.On == on && current.ChangedBy == changedBy) return current;

        var now = DateTime.UtcNow;
        db.TrackingChanges.Add(new TrackingChange
        {
            UserId = userId,
            TrackingOn = on,
            ChangedBy = changedBy,
            AdminId = changedBy == "admin" ? adminId : null,
            At = now
        });
        await db.SaveChangesAsync();
        return new TrackingState(on, changedBy, now);
    }

    // The study running right now, or null.
    public static Task<Study?> RunningAsync(AccountsContext db) =>
        db.Studies
            .AsNoTracking()
            .Where(s => s.EndedAt == null)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

    private static Task<Guid> AdminRoleIdAsync(AccountsContext db) =>
        db.Roles
            .Where(r => r.Name == Roles.Admin)
            .Select(r => r.Id)
            .FirstAsync();
}