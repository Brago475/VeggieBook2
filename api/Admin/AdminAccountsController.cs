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
// Admins only. Guests never appear here. Admin accounts are visible to the
// root admin only; for every other admin they do not exist (search leaves
// them out, and opening one gives 404).
//
// Email is shown only as the account's label. First and last name, password
// hash, recovery PIN, security question and answer are never read here.
// Research IDs are never returned here.

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

        var adminRoleId = await AdminRoleId();
        var root = await AdminRules.IsRootAsync(User, users, config);

        var query = db.Users.AsNoTracking().Where(u => u.GuestExpiresAt == null);

        if (!root)
            query = query.Where(u => !db.UserRoles.Any(r => r.UserId == u.Id && r.RoleId == adminRoleId));

        if (term.Length > 0)
        {
            // Partial, case-insensitive match. % and _ are matched as plain
            // characters.
            var pattern = "%" + EscapeLike(term) + "%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Email!, pattern, "\\") ||
                EF.Functions.ILike(u.DisplayName!, pattern, "\\"));
        }

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
                RecoveryLocked = u.RecoveryLockedAt != null,
                u.LockoutEnd
            })
            .ToListAsync();

        var now = DateTimeOffset.UtcNow;
        var results = rows.Select(r => new
        {
            id = r.Id,
            email = r.Email,
            username = r.DisplayName,
            isAdmin = r.IsAdmin,
            isRootAdmin = AdminRules.IsRoot(config, r.Email),
            createdAt = r.CreatedAt,
            bookCount = r.BookCount,
            recoveryLocked = r.RecoveryLocked,
            signInLocked = r.LockoutEnd > now
        });

        return Ok(new { results, limit = MaxResults });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        if (!await CanSee(id)) return NotFound();

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
            recoveryLockedAt = account.RecoveryLockedAt,
            signInLockedUntil = account.LockoutEnd > now ? account.LockoutEnd : null
        });
    }

    // Reopens password reset and clears every wrong PIN and answer try.
    [HttpPost("{id:guid}/unlock-recovery")]
    public async Task<IActionResult> UnlockRecovery(Guid id)
    {
        if (!await CanSee(id)) return NotFound();

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

    // The root admin sees every account; other admins never see admins.
    private async Task<bool> CanSee(Guid id)
    {
        if (await AdminRules.IsRootAsync(User, users, config)) return true;
        var adminRoleId = await AdminRoleId();
        return !await db.UserRoles.AnyAsync(r => r.UserId == id && r.RoleId == adminRoleId);
    }

    private async Task<Guid> AdminRoleId() =>
        await db.Roles
            .Where(r => r.Name == Roles.Admin)
            .Select(r => r.Id)
            .FirstAsync();

    private static string EscapeLike(string s) =>
        s.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}