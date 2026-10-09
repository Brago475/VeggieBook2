namespace VeggieBook.Api.Data;

// One line in the activity log (db/migrations/007_activity_log.sql),
// mapped in AccountsContext. Written by Activity/ActivityLog.cs and read by
// the admin Overview's Recent activity list.
//
// Anonymous by design: the research ID is stored as text, never the account
// ID, so a line keeps no link to the account and survives its deletion.

public class ActivityEntry
{
    public long Id { get; set; }
    public DateTime At { get; set; }

    // book_deleted or account_deleted
    public string Kind { get; set; } = "";

    public string ParticipantId { get; set; } = "";

    // Set only for book_deleted.
    public string? BookKind { get; set; }
    public string? VegetableCode { get; set; }
    public int? SecretCategoryId { get; set; }
    public int? ItemCount { get; set; }
}