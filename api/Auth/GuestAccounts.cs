using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Everything about temporary guest accounts.
//
// A guest is a real row in app_user with the Guest role, no password, and
// guest_expires_at set. Their books save like anyone's, so the whole app
// works for them. The account and its books are deleted:
//   when the guest signs out,
//   when they sign up or sign in and choose to start fresh,
//   or by GuestCleanupWorker, 24 hours after the guest started.
//
// Deleting an app_user row cascades in the database to its roles, books,
// answers, selections, and uploaded covers, so one delete removes it all.
public class GuestAccounts(AccountsContext db, UserManager<AppUser> users)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(24);

    public static bool IsGuest(AppUser user) => user.GuestExpiresAt is not null;

    public async Task<AppUser> CreateAsync()
    {
        var id = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var user = new AppUser
        {
            Id = id,
            UserName = $"guest-{id:N}",
            Email = $"guest-{id:N}@{AuthHelpers.GuestEmailDomain}",
            CreatedAt = now,
            GuestExpiresAt = now.Add(Lifetime)
        };

        // No password: a guest can never sign in again, only continue in the
        // browser that holds their session.
        var created = await users.CreateAsync(user);
        if (!created.Succeeded)
            throw new InvalidOperationException(
                "Could not create a guest account: " + AuthHelpers.FirstError(created));

        var role = await users.AddToRoleAsync(user, Roles.Guest);
        if (!role.Succeeded)
            throw new InvalidOperationException(
                "Could not give the guest account the Guest role. Has migration 003 run?");

        return user;
    }

    // Used when a guest signs up and keeps their books: the guest account
    // must last until the email is confirmed.
    public async Task ExtendAsync(AppUser guest)
    {
        guest.GuestExpiresAt = DateTime.UtcNow.Add(Lifetime);
        await users.UpdateAsync(guest);
    }

    // Moves every book from a guest into a real account, then deletes the
    // guest. Does nothing if that id is not a guest (already expired, or not
    // a guest at all), so a real account's books can never be moved.
    public async Task MoveBooksAsync(Guid guestId, Guid toUserId)
    {
        await using var tx = await db.Database.BeginTransactionAsync();

        var isGuest = await db.Users.AnyAsync(u => u.Id == guestId && u.GuestExpiresAt != null);
        if (!isGuest) return;

        await db.Books
            .Where(b => b.UserId == guestId)
            .ExecuteUpdateAsync(s => s.SetProperty(b => b.UserId, toUserId));

        await db.Users
            .Where(u => u.Id == guestId)
            .ExecuteDeleteAsync();

        await tx.CommitAsync();
    }

    // Only ever deletes guests, whatever id it is given.
    public Task<int> DeleteAsync(Guid guestId) =>
        db.Users
            .Where(u => u.Id == guestId && u.GuestExpiresAt != null)
            .ExecuteDeleteAsync();

    public Task<int> DeleteExpiredAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        return db.Users
            .Where(u => u.GuestExpiresAt != null && u.GuestExpiresAt < now)
            .ExecuteDeleteAsync(ct);
    }
}