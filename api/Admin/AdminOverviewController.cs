using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// The numbers at the top of the admin page.
//
//   GET /api/admin/overview
//
// Admins only (Roles.AdminPolicy). Counts only: no account appears here.
//
// "Accounts" means real accounts. Guests are counted on their own, since
// they are temporary and deleted after 24 hours (see Auth/GuestAccounts.cs).
// Books are counted for real accounts only, for the same reason.

[ApiController]
[Route("api/admin/overview")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminOverviewController(AccountsContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);

        var accounts = db.Users.AsNoTracking().Where(u => u.GuestExpiresAt == null);
        var accountBooks = db.Books.AsNoTracking()
            .Where(b => accounts.Any(u => u.Id == b.UserId));

        return Ok(new
        {
            accounts = await accounts.CountAsync(),
            newAccountsThisWeek = await accounts.CountAsync(u => u.CreatedAt >= weekAgo),
            recoveryLocked = await accounts.CountAsync(u => u.RecoveryLockedAt != null),
            activeGuests = await db.Users.AsNoTracking()
                .CountAsync(u => u.GuestExpiresAt != null && u.GuestExpiresAt > now),
            veggieBooks = await accountBooks.CountAsync(b => b.Kind == "veggie"),
            secretsBooks = await accountBooks.CountAsync(b => b.Kind == "secrets")
        });
    }
}