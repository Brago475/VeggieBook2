namespace VeggieBook.Api.Data;

// One line of the activity log (db/migrations/007_activity_log.sql,
// 010_activity_detail.sql). Lines are permanent.
//
// Participant events carry a research ID; admin study actions leave it empty
// and store the study number in ItemCount and a readable summary in Detail.

public class ActivityEntry
{
    public long Id { get; set; }
    public DateTime At { get; set; }

    // book_saved, book_deleted, account_deleted, study_renamed, study_deleted
    public string Kind { get; set; } = "";

    public string ParticipantId { get; set; } = "";

    // Book lines only.
    public string? BookKind { get; set; }
    public string? VegetableCode { get; set; }
    public int? SecretCategoryId { get; set; }

    // Items in the book for book lines; the study number for study lines.
    public int? ItemCount { get; set; }

    // Readable summary for study lines.
    public string? Detail { get; set; }
}