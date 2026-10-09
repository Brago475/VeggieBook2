using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Activity;

// Writes the activity log (db/migrations/007_activity_log.sql): a book
// deleted by its owner, and an account deleted by its owner. These leave no
// other trace, so without the log the admin site could never show them.
//
// Two steps, so the line is ready before anything is removed:
//
//   1. ForBookAsync / ForAccountAsync, BEFORE deleting: checks the account
//      is a participant and looks up its research ID while the account
//      still exists. Returns null for guests and admins, who are never
//      logged.
//   2. SaveAsync, AFTER the delete succeeded: stores the line.
//
// Logging never blocks a delete. Any failure (including the table not
// existing yet) is written to the server log and the delete goes ahead.

public static class ActivityLog
{
    public const string BookDeleted = "book_deleted";
    public const string AccountDeleted = "account_deleted";

    public static async Task<ActivityEntry?> ForBookAsync(
        AccountsContext db,
        ILogger logger,
        Guid userId,
        string bookKind,
        string? vegetableCode,
        int? secretCategoryId,
        int itemCount)
    {
        try
        {
            if (!await IsParticipantAsync(db, userId)) return null;
            return new ActivityEntry
            {
                Kind = BookDeleted,
                ParticipantId = await ParticipantIds.ForUserAsync(db, userId),
                BookKind = bookKind,
                VegetableCode = vegetableCode,
                SecretCategoryId = secretCategoryId,
                ItemCount = itemCount
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Activity log: could not prepare a book deletion line.");
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

    public static async Task SaveAsync(AccountsContext db, ILogger logger, ActivityEntry? entry)
    {
        if (entry is null) return;

        entry.At = DateTime.UtcNow;
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

    // Participants are real accounts that are not admins, the same people
    // the research sheets and Overview count.
    private static Task<bool> IsParticipantAsync(AccountsContext db, Guid userId) =>
        db.Users.AnyAsync(u =>
            u.Id == userId
            && u.GuestExpiresAt == null
            && !db.UserRoles.Any(ur =>
                ur.UserId == u.Id && db.Roles.Any(r => r.Id == ur.RoleId && r.Name == Roles.Admin)));
}