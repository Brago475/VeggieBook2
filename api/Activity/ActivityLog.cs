using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Activity;

// Writes the activity log (db/migrations/007_activity_log.sql): books saved,
// books deleted, and accounts deleted, by research ID. Entries are permanent
// and back the admin Activity page.
//
// Two steps: ForBookAsync / ForAccountAsync prepare the entry while the
// account still exists (null for guests and admins), then SaveAsync stores
// it. Logging never blocks the main action; failures go to the server log.

public static class ActivityLog
{
    public const string BookSaved = "book_saved";
    public const string BookDeleted = "book_deleted";
    public const string AccountDeleted = "account_deleted";

    public static async Task<ActivityEntry?> ForBookAsync(
        AccountsContext db,
        ILogger logger,
        Guid userId,
        string bookKind,
        string? vegetableCode,
        int? secretCategoryId,
        int itemCount,
        string kind = BookDeleted)
    {
        try
        {
            if (!await IsParticipantAsync(db, userId)) return null;
            return new ActivityEntry
            {
                Kind = kind,
                ParticipantId = await ParticipantIds.ForUserAsync(db, userId),
                BookKind = bookKind,
                VegetableCode = vegetableCode,
                SecretCategoryId = secretCategoryId,
                ItemCount = itemCount
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Activity log: could not prepare a {Kind} line.", kind);
            return null;
        }
    }

    public static async Task<ActivityEntry?> ForAccountAsync(AccountsContext db, ILogger logger, Guid userId)
    {
        try
        {
            if (!await IsParticipantAsync(db, userId)) return null;
            return new ActivityEntry
            {
                Kind = AccountDeleted,
                ParticipantId = await ParticipantIds.ForUserAsync(db, userId)
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Activity log: could not prepare an account deletion line.");
            return null;
        }
    }

    /// <summary>Stores the entry. At defaults to now; a save entry sets it to the book's CreatedAt.</summary>
    public static async Task SaveAsync(AccountsContext db, ILogger logger, ActivityEntry? entry)
    {
        if (entry is null) return;

        if (entry.At == default) entry.At = DateTime.UtcNow;
        db.ActivityLog.Add(entry);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            db.Entry(entry).State = EntityState.Detached;
            logger.LogWarning(ex, "Activity log: could not save a {Kind} line.", entry.Kind);
        }
    }

    // Participants are real accounts that are not admins.
    private static Task<bool> IsParticipantAsync(AccountsContext db, Guid userId) =>
        db.Users.AnyAsync(u =>
            u.Id == userId
            && u.GuestExpiresAt == null
            && !db.UserRoles.Any(ur =>
                ur.UserId == u.Id && db.Roles.Any(r => r.Id == ur.RoleId && r.Name == Roles.Admin)));
}