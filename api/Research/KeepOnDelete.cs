using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// Deleting books and accounts without losing research data.
//
// A book is kept (hidden, marked deleted) when its owner is a real, non-admin
// account and tracking was on when it was saved. Otherwise it is erased.
// Uploaded cover photos are always erased; HadUpload records them.
//
// A real, non-admin account is wiped of personal details and marked deleted.
// Its research ID, tracking history, age range, and join date stay. Guest
// and admin accounts are erased, since they are never tracked.
//
// Activity log lines are written by the callers.

public static class KeepOnDelete
{
    // Returns false when the book does not exist or belongs to someone else.
    public static async Task<bool> DeleteBookAsync(AccountsContext db, Guid userId, Guid bookId)
    {
        var book = await db.Books
            .AsNoTracking()
            .Where(b => b.Id == bookId && b.UserId == userId)
            .Select(b => new { b.Id, b.CreatedAt })
            .FirstOrDefaultAsync();
        if (book is null) return false;

        var keep = await IsResearchAccountAsync(db, userId)
            && TrackingOnAt(await ChangesAsync(db, userId), book.CreatedAt);

        await using var tx = await db.Database.BeginTransactionAsync();

        if (keep)
            await KeepBooksAsync(db, [book.Id], DateTime.UtcNow);
        else
            await db.Books.Where(b => b.Id == book.Id).ExecuteDeleteAsync();

        await tx.CommitAsync();
        return true;
    }

    // The user must be loaded through UserManager so Identity sees the change.
    public static async Task<IdentityResult> DeleteAccountAsync(
        AccountsContext db, UserManager<AppUser> users, AppUser user)
    {
        if (!await IsResearchAccountAsync(db, user.Id))
            return await users.DeleteAsync(user);

        var now = DateTime.UtcNow;
        var changes = await ChangesAsync(db, user.Id);

        var books = await db.Books
            .AsNoTracking()
            .Where(b => b.UserId == user.Id)
            .Select(b => new { b.Id, b.CreatedAt })
            .ToListAsync();

        var keepIds = books.Where(b => TrackingOnAt(changes, b.CreatedAt)).Select(b => b.Id).ToList();
        var eraseIds = books.Select(b => b.Id).Except(keepIds).ToList();

        await using var tx = await db.Database.BeginTransactionAsync();

        if (eraseIds.Count > 0)
            await db.Books.Where(b => eraseIds.Contains(b.Id)).ExecuteDeleteAsync();
        if (keepIds.Count > 0)
            await KeepBooksAsync(db, keepIds, now);

        await db.UserClaims.Where(c => c.UserId == user.Id).ExecuteDeleteAsync();
        await db.UserLogins.Where(l => l.UserId == user.Id).ExecuteDeleteAsync();
        await db.UserTokens.Where(t => t.UserId == user.Id).ExecuteDeleteAsync();

        Wipe(user, now);
        await db.SaveChangesAsync();

        await tx.CommitAsync();
        return IdentityResult.Success;
    }

    // Marks books deleted, records uploaded covers, then erases the photos.
    private static async Task KeepBooksAsync(AccountsContext db, List<Guid> ids, DateTime now)
    {
        var uploaded = await db.BookCoverUploads
            .Where(c => ids.Contains(c.SessionId))
            .Select(c => c.SessionId)
            .ToListAsync();

        if (uploaded.Count > 0)
            await db.Books
                .Where(b => uploaded.Contains(b.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(b => b.HadUpload, true));

        await db.BookCoverUploads.Where(c => ids.Contains(c.SessionId)).ExecuteDeleteAsync();

        await db.Books
            .Where(b => ids.Contains(b.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(b => b.DeletedAt, now));
    }

    // Removes everything personal. Age range, join date and terms version stay
    // as research context. A new security stamp ends every signed-in session.
    private static void Wipe(AppUser user, DateTime now)
    {
        user.UserName = $"deleted-{user.Id}";
        user.NormalizedUserName = user.UserName.ToUpperInvariant();
        user.Email = null;
        user.NormalizedEmail = null;
        user.EmailConfirmed = false;
        user.PasswordHash = null;
        user.PhoneNumber = null;
        user.PhoneNumberConfirmed = false;
        user.SecurityStamp = Guid.NewGuid().ToString();
        user.ConcurrencyStamp = Guid.NewGuid().ToString();
        user.LockoutEnabled = true;
        user.LockoutEnd = DateTimeOffset.MaxValue;

        user.FirstName = null;
        user.LastName = null;
        user.DisplayName = null;
        user.PendingGuestId = null;

        user.RecoveryPinHash = null;
        user.SecurityQuestionId = null;
        user.SecurityAnswerHash = null;
        user.PinFailedCount = 0;
        user.PinFailWindowStart = null;
        user.AnswerFailedCount = 0;
        user.AnswerFailWindowStart = null;
        user.RecoveryLockedAt = null;

        user.DeletedAt = now;
    }

    private static async Task<bool> IsResearchAccountAsync(AccountsContext db, Guid userId)
    {
        var isGuest = await db.Users.AnyAsync(u => u.Id == userId && u.GuestExpiresAt != null);
        if (isGuest) return false;

        var isAdmin = await db.UserRoles.AnyAsync(ur =>
            ur.UserId == userId && db.Roles.Any(r => r.Id == ur.RoleId && r.Name == Roles.Admin));
        return !isAdmin;
    }

    private static Task<List<TrackingChange>> ChangesAsync(AccountsContext db, Guid userId) =>
        db.TrackingChanges
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.At)
            .ThenBy(c => c.Id)
            .ToListAsync();

    // Same rule as TrackingHistory.At: the latest change at or before the
    // moment, or on (the default) when there is none.
    private static bool TrackingOnAt(List<TrackingChange> changes, DateTime when)
    {
        TrackingChange? last = null;
        foreach (var change in changes)
        {
            if (change.At > when) break;
            last = change;
        }
        return last?.TrackingOn ?? true;
    }
}