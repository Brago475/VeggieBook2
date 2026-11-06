using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Notifications;

// Activity log lines for notifications.
//
// Participant lines (shown, opened, link, dismissed) are written only for
// real, non-admin accounts with tracking on while a study is running, as the
// Privacy Policy states. ContentId holds the notification number, ItemCount
// the round, and Detail the template and vegetable ("in_season:lettuce") or
// "custom".
//
// Admin lines (created, edited, stopped) have no participant; ContentId holds
// the notification number and Detail a readable summary.

public static class NotificationActivity
{
    public const string Shown = "notification_shown";
    public const string Opened = "notification_opened";
    public const string Link = "notification_link";
    public const string Dismissed = "notification_dismissed";

    public const string Created = "notification_created";
    public const string Edited = "notification_edited";
    public const string Stopped = "notification_stopped";

    public static async Task RecordAsync(
        AccountsContext db,
        ILogger logger,
        Guid userId,
        string kind,
        Notification n,
        int round)
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
                ContentId = n.Id,
                ItemCount = round,
                Detail = DetailOf(n)
            };
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
        Notification n,
        string summary) =>
        ActivityLog.SaveAsync(db, logger, new ActivityEntry
        {
            Kind = kind,
            ParticipantId = "",
            ContentId = n.Id,
            Detail = summary
        });

    private static string DetailOf(Notification n) =>
        n.TemplateKey is null ? "custom"
        : n.Vegetable is null ? n.TemplateKey
        : $"{n.TemplateKey}:{n.Vegetable}";
}