using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Making an account an admin, and taking that away.
//
//   POST   /api/admin/accounts/{id}/admin    give the Admin role
//   DELETE /api/admin/accounts/{id}/admin    remove the Admin role
//
// Root admin only. Every other admin gets 403.
//
// Rules:
//   - Only a full account (role User) can be made an admin, never a guest.
//   - No one can remove their own Admin role.
//   - The root admin cannot lose the role here; that is done on the server.
//
// A removed role takes effect on that person's next request.

[ApiController]
[Route("api/admin/accounts/{id:guid}/admin")]
[Authorize(Policy = Roles.AdminPolicy)]
[RootAdminOnly]
public class AdminRolesController(UserManager<AppUser> users, IConfiguration config)
    : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Grant(Guid id)
    {
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null || GuestAccounts.IsGuest(user)) return NotFound();

        if (!await users.IsInRoleAsync(user, Roles.User))
            return Conflict(new { error = "Only a full account can be made an admin." });

        if (await users.IsInRoleAsync(user, Roles.Admin))
            return Conflict(new { error = "This account is already an admin." });

        var result = await users.AddToRoleAsync(user, Roles.Admin);
        if (!result.Succeeded)
            return StatusCode(500, new { error = "The role could not be added. Please try again." });

        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null || GuestAccounts.IsGuest(user)) return NotFound();

        if (AuthSetup.UserId(User) == id)
            return Conflict(new { error = "You can't remove your own admin role." });

        if (AdminRules.IsRoot(config, user.Email))
            return Conflict(new { error = "The main admin can only be changed on the server." });

        if (!await users.IsInRoleAsync(user, Roles.Admin))
            return Conflict(new { error = "This account is not an admin." });

        var result = await users.RemoveFromRoleAsync(user, Roles.Admin);
        if (!result.Succeeded)
            return StatusCode(500, new { error = "The role could not be removed. Please try again." });

        return NoContent();
    }
}