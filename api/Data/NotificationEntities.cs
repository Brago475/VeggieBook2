namespace VeggieBook.Api.Data;

// Admin notifications shown in the main site.
// See db/migrations/019_notifications.sql and 020_notification_english_only.sql.

public class Notification
{
    public const string AudienceAll = "all";
    public const string AudienceSelected = "selected";

    public int Id { get; set; }
    public string BodyEn { get; set; } = "";

    // Set only for a pilot template sent with its English unchanged.
    // Otherwise everyone sees the English.
    public string? BodyEs { get; set; }

    // The pilot template it came from, and the vegetable chosen for it.
    public string? TemplateKey { get; set; }
    public string? Vegetable { get; set; }

    public string Audience { get; set; } = AudienceAll;
    public bool IncludeGuests { get; set; }

    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }

    // Shows again every RepeatDays days between StartsAt and ExpiresAt.
    public int? RepeatDays { get; set; }

    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public List<NotificationTarget> Targets { get; set; } = [];
}

// An account included in, or excluded from, one notification.
public class NotificationTarget
{
    public const string Include = "include";
    public const string Exclude = "exclude";

    public int NotificationId { get; set; }
    public Guid UserId { get; set; }
    public string Mode { get; set; } = Include;
}

// What one account did with one round of a notification.
public class NotificationReceipt
{
    public int NotificationId { get; set; }
    public Guid UserId { get; set; }
    public int Round { get; set; }
    public DateTime ShownAt { get; set; }
    public DateTime? OpenedAt { get; set; }
    public DateTime? ClickedAt { get; set; }
    public DateTime? DismissedAt { get; set; }
}