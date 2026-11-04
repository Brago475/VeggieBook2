namespace VeggieBook.Api.Data;

// One line of the activity log (db/migrations/007, 010, 013, 015 and 016).
// Lines are permanent: nothing edits or deletes them.
//
// Participant events carry a research ID; admin study actions leave it empty
// and store the study number in ItemCount and a readable summary in Detail.

public class ActivityEntry
{
    public long Id { get; set; }
    public DateTime At { get; set; }

    // book_saved, book_deleted, item_removed, book_printed, book_downloaded,
    // account_deleted, study_renamed, study_deleted
    public string Kind { get; set; } = "";

    public string ParticipantId { get; set; } = "";

    // Book lines only.
    public string? BookKind { get; set; }
    public string? VegetableCode { get; set; }
    public int? SecretCategoryId { get; set; }

    // Print and download lines: the saved book they are about.
    public Guid? BookId { get; set; }

    // Items kept for book lines, items taken out for item_removed, pages for
    // print and download lines, the study number for study lines.
    public int? ItemCount { get; set; }

    // book_saved only: items dropped while making the book.
    public int? TakenOutCount { get; set; }

    // Print and download lines: the recipe or secret, when one item was used.
    public int? ContentId { get; set; }

    // Study lines: a readable summary. Print and download lines: what was
    // used (book, extras, recipe, secret).
    public string? Detail { get; set; }
}