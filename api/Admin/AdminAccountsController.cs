using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Finding an account and helping its owner.
//
//   GET  /api/admin/accounts?q=           search by email or username
//   GET  /api/admin/accounts/{id}         one account
//   POST /api/admin/accounts/{id}/unlock-recovery
//                                         reopen password reset after the
//                                         owner failed their security question
//
// Admins only (Roles.AdminPolicy). Guests never appear here.
// Giving and removing the Admin role: AdminRolesController.
// An account's books: AdminBooksController.
//
// What the admin can see, by design: email (only as the account's label, so
// a locked-out user can be found), username, role, age range, dates, and
// lock status. What is never read from the database here: first and last
// name, password hash, recovery PIN, security question, and security answer.
// Leaving them out of every query means no change to the response shape can
// expose them by accident.
//
// The email is never copied into study data or reports. Those use account
// and tracking IDs only.

[ApiController]
[Route("api/admin/accounts")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminAccountsController(
    AccountsContext db,
    UserManager<AppUser> users,
    IConfiguration config) : ControllerBase
{
    private const int MaxResults = 25;
    private const int MaxSearchLength = 256;

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? q)
    {
        var term = (q ?? "").Trim();
        if (term.Length > MaxSearchLength)
            return BadRequest(new { error = "Search is too long." });

        var query = db.Users.AsNoTracking().Where(u => u.GuestExpiresAt == null);

        if (term.Length > 0)
        {
            // Partial, case-insensitive match. % and _ in the search are
            // escaped so they are matched as plain characters.
            var pattern = "%" + EscapeLike(term) + "%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Email!, pattern, "\\") ||
                EF.Functions.ILike(u.DisplayName!, pattern, "\\"));
        }

        var adminRoleId = await AdminRoleId();

        var rows = await query
            .OrderByDescending(u => u.CreatedAt)
            .Take(MaxResults)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                IsAdmin = db.UserRoles.Any(r => r.UserId == u.Id && r.RoleId == adminRoleId),
                u.CreatedAt,
                BookCount = db.Books.Count(b => b.UserId == u.Id),
                RecoveryLocked = u.RecoveryLockedAt != null
            })
            .ToListAsync();

        // The root admin is matched against Admin__RootEmail after the query,
        // since that setting lives in the environment, not the database.
        var results = rows.Select(r => new
        {
            id = r.Id,
            email = r.Email,
            username = r.DisplayName,
            isAdmin = r.IsAdmin,
            isRootAdmin = AdminRules.IsRoot(config, r.Email),
            createdAt = r.CreatedAt,
            bookCount = r.BookCount,
            recoveryLocked = r.RecoveryLocked
        });

        return Ok(new { results, limit = MaxResults });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var now = DateTimeOffset.UtcNow;

        var account = await db.Users
            .AsNoTracking()
            .Where(u => u.Id == id && u.GuestExpiresAt == null)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                u.AgeRange,
                u.CreatedAt,
                u.TermsVersion,
                u.TermsAcceptedAt,
                u.RecoveryLockedAt,
                u.LockoutEnd,
                BookCount = db.Books.Count(b => b.UserId == u.Id)
            })
            .FirstOrDefaultAsync();

        if (account is null) return NotFound();

        var roles = await db.UserRoles
            .Where(r => r.UserId == id)
            .Join(db.Roles, ur => ur.RoleId, r => r.Id, (_, r) => r.Name!)
            .OrderBy(n => n)
            .ToListAsync();

        return Ok(new
        {
            id = account.Id,
            email = account.Email,
            username = account.DisplayName,
            roles,
            isRootAdmin = AdminRules.IsRoot(config, account.Email),
            ageRange = account.AgeRange,
            createdAt = account.CreatedAt,
            termsVersion = account.TermsVersion,
            termsAcceptedAt = account.TermsAcceptedAt,
            bookCount = account.BookCount,
            // Password reset locked after 3 wrong security answers. Only an
            // admin can clear it (below).
            recoveryLockedAt = account.RecoveryLockedAt,
            // Sign-in locked for 15 minutes after 5 wrong passwords. Clears on
            // its own, so the admin site only shows it.
            signInLockedUntil = account.LockoutEnd > now ? account.LockoutEnd : null
        });
    }

    // Reopens password reset. Clears every wrong PIN and answer try, so the
    // owner starts again with the PIN. Sign-in was never blocked by this
    // lock, so nothing else changes.
    //
    // TODO: record who unlocked which account and when, once the admin
    // activity log exists.
    [HttpPost("{id:guid}/unlock-recovery")]
    public async Task<IActionResult> UnlockRecovery(Guid id)
    {
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null || user.GuestExpiresAt is not null) return NotFound();

        if (!AccountRecovery.IsLocked(user))
            return Conflict(new { error = "Password reset is not locked for this account." });

        AccountRecovery.ClearTries(user);
        var result = await users.UpdateAsync(user);
        if (!result.Succeeded)
            return StatusCode(500, new { error = "The account could not be unlocked. Please try again." });

        return NoContent();
    }

    private async Task<Guid> AdminRoleId() =>
        await db.Roles
            .Where(r => r.Name == Roles.Admin)
            .Select(r => r.Id)
            .FirstAsync();

    private static string EscapeLike(string s) =>
        s.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}