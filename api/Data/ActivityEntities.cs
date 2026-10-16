namespace VeggieBook.Api.Data;

// One line of the activity log (db/migrations/007, 010 and 013). Lines are
// permanent.
//
// Participant events carry a research ID; admin study actions leave it empty
// and store the study number in ItemCount and a readable summary in Detail.

public class ActivityEntry
{
    public long Id { get; set; }
    public DateTime At { get; set; }

    // book_saved, book_deleted, item_removed, account_deleted, study_renamed, study_deleted
    public string Kind { get; set; } = "";

    public string ParticipantId { get; set; } = "";

    // Book lines only.
    public string? BookKind { get; set; }
    public string? VegetableCode { get; set; }
    public int? SecretCategoryId { get; set; }

    // Items kept for book lines, items taken out for item_removed, the study
    // number for study lines.
    public int? ItemCount { get; set; }

    // book_saved only: items dropped while making the book.
    public int? TakenOutCount { get; set; }

    // Readable summary for study lines.
    public string? Detail { get; set; }
}