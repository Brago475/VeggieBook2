using VeggieBook.Api.Data;

namespace VeggieBook.Api.Notifications;

// Who sees a notification and when, shared by the app and the admin site.
//
//   Live      between StartsAt and ExpiresAt, unless stopped.
//   Rounds    with RepeatDays set, a new round starts every RepeatDays days
//             and pops up again. Without it there is only round 0.
//   Audience  guests only when IncludeGuests is on; accounts by Audience:
//             "all" minus the excluded, or "selected" (the included only).
//             Admins are left out by the callers.

public static class NotificationRules
{
    public static bool IsLive(Notification n, DateTime now) =>
        n.CancelledAt is null && n.StartsAt <= now && now < n.ExpiresAt;

    public static int RoundAt(Notification n, DateTime now)
    {
        if (n.RepeatDays is not int days || now <= n.StartsAt) return 0;
        return (int)((now - n.StartsAt).TotalDays / days);
    }

    public static DateTime RoundStart(Notification n, int round) =>
        n.RepeatDays is int days ? n.StartsAt.AddDays((double)days * round) : n.StartsAt;

    // Targets may be filtered to the one account being checked.
    public static bool Reaches(Notification n, Guid userId, bool isGuest)
    {
        if (isGuest) return n.IncludeGuests;

        var target = n.Targets.FirstOrDefault(t => t.UserId == userId);
        return n.Audience == Notification.AudienceSelected
            ? target?.Mode == NotificationTarget.Include
            : target?.Mode != NotificationTarget.Exclude;
    }

    // scheduled, live, ended, or stopped.
    public static string StatusOf(Notification n, DateTime now) =>
        n.CancelledAt is not null ? "stopped"
        : now < n.StartsAt ? "scheduled"
        : now < n.ExpiresAt ? "live"
        : "ended";

    // Spanish only when the message has it; otherwise everyone sees the English.
    public static string TextFor(Notification n, string lang) =>
        lang == "es" && !string.IsNullOrEmpty(n.BodyEs) ? n.BodyEs : n.BodyEn;
}