using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Activity;

// Writes the activity log (db/migrations/007_activity_log.sql,
// 010_activity_detail.sql): books saved and deleted, accounts deleted, and
// studies renamed or deleted. Entries are permanent and back the admin
// Activity page.
//
// Participant lines are prepared while the account still exists (null for
// guests and admins), then stored with SaveAsync. Logging never blocks the
// main action; failures go to the server log.
//
// An account deleted from the admin site is an account_deleted line with
// Detail set to RemovedByAdmin, so no new kind is needed in the database.

public static class ActivityLog
{
    public const string BookSaved = "book_saved";
    public const string BookDeleted = "book_deleted";
    public const string AccountDeleted = "account_deleted";
    public const string StudyRenamed = "study_renamed";
    public const string StudyDeleted = "study_deleted";

    /// <summary>Detail on an account_deleted line when an admin removed the account.</summary>
    public const string RemovedByAdmin = "removed_by_admin";

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

    public static async Task<ActivityEntry?> ForAccountAsync(
        AccountsContext db,
        ILogger logger,
        Guid userId,
        bool byAdmin = false)
    {
        try
        {
            if (!await IsParticipantAsync(db, userId)) return null;
            return new ActivityEntry
            {
                Kind = AccountDeleted,
                ParticipantId = await ParticipantIds.ForUserAsync(db, userId),
                Detail = byAdmin ? RemovedByAdmin : null
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Activity log: could not prepare an account deletion line.");
            return null;
        }
    }

    /// <summary>True when an account_deleted line was written by an admin removal.</summary>
    public static bool IsRemovedByAdmin(ActivityEntry entry) =>
        entry.Kind == AccountDeleted && entry.Detail == RemovedByAdmin;

    /// <summary>An admin study action. No participant; the study number goes in ItemCount.</summary>
    public static ActivityEntry ForStudy(string kind, int studyNumber, string detail) => new()
    {
        Kind = kind,
        ParticipantId = "",
        ItemCount = studyNumber,
        Detail = detail
    };

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