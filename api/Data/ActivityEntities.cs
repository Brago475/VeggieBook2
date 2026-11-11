using System.ComponentModel.DataAnnotations.Schema;

namespace VeggieBook.Api.Data;

// One line of the activity log (db/migrations/007, 010, 013, 015, 016, 024
// and 027). Lines are permanent: nothing edits or deletes them.
//
// Participant lines carry a research ID and no AdminId. Admin lines leave
// the research ID empty and set AdminId to the admin who did the action.

public class ActivityEntry
{
    public long Id { get; set; }
    public DateTime At { get; set; }

    // Allowed kinds are listed in db/migrations/027_activity_admin.sql.
    public string Kind { get; set; } = "";

    public string ParticipantId { get; set; } = "";

    // The admin who did this. Null on participant lines and older lines.
    [Column("admin_id")]
    public Guid? AdminId { get; set; }

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

    // Study and admin lines: a readable summary. Print and download lines:
    // what was used (book, extras, recipe, secret).
    public string? Detail { get; set; }
}