using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Playlists;

// Activity log lines for playlists.
//
// Participant lines follow the same rules as notification lines: real,
// non-admin accounts with tracking on while a study is running. ContentId
// holds the playlist number and Detail the source ("admin" or "own"); for an
// opened item, Detail is "source:kind:id" (for example "admin:recipe:212").
//
// Admin lines have no participant; ContentId holds the playlist number and
// Detail a readable summary.

public static class PlaylistActivity
{
    // Admin
    public const string Created = "playlist_created";
    public const string Edited = "playlist_edited";
    public const string Archived = "playlist_archived";

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
        string summary) =>
        ActivityLog.SaveAsync(db, logger, new ActivityEntry
        {
            Kind = kind,
            ParticipantId = "",
            ContentId = p.Id,
            Detail = summary
        });
}