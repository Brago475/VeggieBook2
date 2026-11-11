using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Playlists;

// Activity log lines for playlists and meal labels.
//
// Participant lines follow the same rules as notification lines: real,
// non-admin accounts with tracking on while a study is running. ContentId
// holds the playlist number and Detail the source ("admin" or "own").
// Only actions are recorded (kept, skipped, removed, own created, edited,
// deleted). Opened and ItemOpened remain so older lines still display.
//
// Admin lines carry the admin in AdminId. Playlist lines hold the playlist
// number in ContentId and a readable summary in Detail. Meal label lines
// hold the item id in ContentId and "kind|after|before" in Detail.

public static class PlaylistActivity
{
    // Admin
    public const string Created = "playlist_created";
    public const string Edited = "playlist_edited";
    public const string Archived = "playlist_archived";
    public const string MealLabelsChanged = "meal_labels_changed";

    // Participant, admin playlists
    public const string Opened = "playlist_opened";
    public const string Kept = "playlist_kept";
    public const string Skipped = "playlist_skipped";
    public const string Removed = "playlist_removed";
    public const string ItemOpened = "playlist_item_opened";

    // Participant, own playlists
    public const string OwnCreated = "user_playlist_created";
    public const string OwnEdited = "user_playlist_edited";
    public const string OwnDeleted = "user_playlist_deleted";

    public const string SourceAdmin = "admin";
    public const string SourceOwn = "own";

    public static string ItemDetail(string source, string kind, int itemId) =>
        $"{source}:{kind}:{itemId}";

    public static async Task RecordAsync(
        AccountsContext db,
        ILogger logger,
        Guid userId,
        string kind,
        int playlistId,
        string detail,
        int? itemCount = null)
    {
        ActivityEntry entry;
        try
        {
            if (await StudyTracking.RunningAsync(db) is null) return;
            if (await db.Users.AnyAsync(u => u.Id == userId && u.GuestExpiresAt != null)) return;
            if (await StudyTracking.IsAdminAsync(db, userId)) return;
            if (!(await StudyTracking.ForUserAsync(db, userId)).On) return;

            entry = new ActivityEntry
            {
                Kind = kind,
                ParticipantId = await ParticipantIds.ForUserAsync(db, userId),
                ContentId = playlistId,
                Detail = detail
            };
            if (itemCount is int count) entry.ItemCount = count;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Activity log: could not prepare a {Kind} line.", kind);
            return;
        }

        await ActivityLog.SaveAsync(db, logger, entry);
    }

    public static Task RecordAdminAsync(
        AccountsContext db,
        ILogger logger,
        string kind,
        Playlist p,
        string summary,
        Guid? adminId = null) =>
        RecordAdminLineAsync(db, logger, kind, p.Id, summary, adminId);

    public static Task RecordAdminLineAsync(
        AccountsContext db,
        ILogger logger,
        string kind,
        int contentId,
        string detail,
        Guid? adminId = null) =>
        ActivityLog.SaveAdminAsync(db, logger, kind, adminId, detail, contentId: contentId);
}