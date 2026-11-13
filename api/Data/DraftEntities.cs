namespace VeggieBook.Api.Data;

// A draft of a new playlist or notification, saved before it is finished.
// Payload is the admin editor's state as JSON. Nothing in the app reads
// drafts; finishing one creates the real playlist or notification.
// See db/migrations/028_admin_draft.sql.

public class AdminDraft
{
    public const string KindPlaylist = "playlist";
    public const string KindNotification = "notification";

    public int Id { get; set; }
    public string Kind { get; set; } = "";
    public string? Title { get; set; }
    public string Payload { get; set; } = "{}";

    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}