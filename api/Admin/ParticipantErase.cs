using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// Erasing a participant on request, found by research ID. Main admin only
// (AdminEraseController). Three levels:
//
//   content     every book erased, including books still in the app.
//               Account kept; tracking turned off by an admin.
//   account     the account deleted as usual (KeepOnDelete), then every
//               book erased. Research ID and tracking history kept.
//   everything  books, account record, tracking history, study notice
//               answers and the research ID link, in one transaction.
//
// Every erase writes a research_erased line to the activity log. The
// activity log is never erased. Admin accounts are refused.

public static class ParticipantErase
{
    public const string Kind = "research_erased";

    public const string Content = "content";
    public const string Account = "account";
    public const string Everything = "everything";

    public const string EverythingPhrase = "ERASE EVERYTHING";

    public static readonly string[] Levels = [Content, Account, Everything];

    public record Target(
        Guid UserId,
        string ResearchId,
        bool AccountDeleted,
        bool IsAdmin,
        int BooksInApp,
        int BooksKept,
        bool TrackingOn,
        int TrackingChanges,
        int Notices);

    public static string Normalize(string? researchId) => (researchId ?? "").Trim().ToUpperInvariant();

    // The participant with this research ID, or null if no account has it.
    public static async Task<Target?> FindAsync(AccountsContext db, string researchId)
    {
        var rid = Normalize(researchId);
        if (rid.Length == 0) return null;

        var userId = await db.ResearchParticipants
            .AsNoTracking()
            .Where(p => p.ParticipantId == rid)
            .Select(p => (Guid?)p.UserId)
            .FirstOrDefaultAsync();
        if (userId is not Guid id) return null;

        var user = await db.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new { u.DeletedAt })
            .FirstOrDefaultAsync();
        if (user is null) return null;

        var books = db.Books.IgnoreQueryFilters().AsNoTracking().Where(b => b.UserId == id);

        return new Target(
            id,
            rid,
            user.DeletedAt != null,
            await StudyTracking.IsAdminAsync(db, id),
            await books.CountAsync(b => b.DeletedAt == null),
            await books.CountAsync(b => b.DeletedAt != null),
            (await StudyTracking.ForUserAsync(db, id)).On,
            await db.TrackingChanges.CountAsync(c => c.UserId == id),
            await db.StudyNotices.CountAsync(n => n.UserId == id));
    }

    // Runs the erase and returns how many books were erased.
    public static async Task<int> EraseAsync(
        AccountsContext db,
        UserManager<AppUser> users,
        Target target,
        string level,
        Guid adminId)
    {
        var id = target.UserId;

        if (level == Everything)
        {
            await using var tx = await db.Database.BeginTransactionAsync();

            var erased = await db.Books.IgnoreQueryFilters().Where(b => b.UserId == id).ExecuteDeleteAsync();
            await db.TrackingChanges.Where(c => c.UserId == id).ExecuteDeleteAsync();
            await db.StudyNotices.Where(n => n.UserId == id).ExecuteDeleteAsync();
            await db.ResearchParticipants.Where(p => p.UserId == id).ExecuteDeleteAsync();
            await db.Users.IgnoreQueryFilters().Where(u => u.Id == id).ExecuteDeleteAsync();

            await tx.CommitAsync();
            return erased;
        }

        // Each step below is complete on its own, so running the same erase
        // again after a failure finishes the job.
        if (level == Account && !target.AccountDeleted)
        {
            var user = await users.FindByIdAsync(id.ToString());
            if (user is not null)
            {
                var result = await KeepOnDelete.DeleteAccountAsync(db, users, user);
                if (!result.Succeeded)
                    throw new InvalidOperationException(result.Errors.FirstOrDefault()?.Description ?? "The account could not be deleted.");
            }
        }

        var count = await db.Books.IgnoreQueryFilters().Where(b => b.UserId == id).ExecuteDeleteAsync();

        if (level == Content)
            await StudyTracking.SetAsync(db, id, false, "admin", adminId);

        return count;
    }

    // The activity line for an erase, by research ID only.
    public static ActivityEntry LogLine(string researchId, string level, int books) => new()
    {
        Kind = Kind,
        ParticipantId = researchId,
        Detail = level,
        ItemCount = books
    };
}