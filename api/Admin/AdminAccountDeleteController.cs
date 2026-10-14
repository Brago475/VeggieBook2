using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Deleting an account from the admin site.
//
//   POST /api/admin/accounts/{id}/delete   { confirmEmail }
//
// Root admin only. The account's email must be typed to confirm.
//
// Rules:
//   - Never the root admin, and never the signed-in admin's own account.
//   - Never an admin account; its admin access is removed first.
//   - Real accounts only. Guests are removed on sign out or after 24 hours.
//
// Works the same as a person deleting their own account
// (Auth/AccountController.cs): books and uploaded covers go with it through
// ON DELETE CASCADE, and the deletion is logged by research ID only. The log
// never blocks the delete.

public record AdminDeleteAccountRequest(string? ConfirmEmail);

[ApiController]
[Route("api/admin/accounts/{id:guid}/delete")]
[Authorize(Policy = Roles.AdminPolicy)]
[RootAdminOnly]
public class AdminAccountDeleteController(
    UserManager<AppUser> users,
    AccountsContext db,
    IConfiguration config,
    ILogger<AdminAccountDeleteController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Delete(Guid id, [FromBody] AdminDeleteAccountRequest req)
    {
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null || GuestAccounts.IsGuest(user)) return NotFound();

        if (AuthSetup.UserId(User) == id)
            return Conflict(new { error = "You can't delete your own account here." });

        if (AdminRules.IsRoot(config, user.Email))
            return Conflict(new { error = "The main admin can only be changed on the server." });

        if (await users.IsInRoleAsync(user, Roles.Admin))
            return Conflict(new { error = "Remove this account's admin access before deleting it." });

        if (!string.Equals((req.ConfirmEmail ?? "").Trim(), user.Email, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "The email typed does not match this account." });

        var entry = await ActivityLog.ForAccountAsync(db, logger, user.Id);

        var result = await users.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { error = AuthHelpers.FirstError(result) });

        await ActivityLog.SaveAsync(db, logger, entry);

        return NoContent();
    }
}