using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 3: deleting an account.
//
//   POST /api/auth/delete   delete the account
//
// Real accounts only. A guest is deleted by signing out. Admin accounts,
// the root admin included, are refused; the root admin removes admin access
// first, then the account can be deleted.
//
// Asks for the password again so a device left signed in cannot be used to
// delete someone's account. Personal details are wiped and research data
// gathered while tracking was on is kept (Research/KeepOnDelete.cs). Other
// devices are signed out on their next request.
//
// The deletion is written to the activity log by research ID only. The ID is
// looked up before deleting and the line is saved after the delete succeeds.
// The log never blocks the delete.

[ApiController]
[Route("api/auth")]
public class AccountController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    AccountsContext db,
    ILogger<AccountController> logger) : ControllerBase
{
    private static readonly ApiError AdminAccount =
        new(ErrorCodes.AdminAccountDelete, "Admin accounts can't be deleted from the site.");

    [HttpPost("delete")]
    [Authorize(Policy = Roles.MemberPolicy)]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest req)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        if (await users.IsInRoleAsync(user, Roles.Admin))
            return Conflict(AdminAccount.Body());

        var password = req.Password ?? "";
        if (password.Length == 0 || password.Length > AuthSetup.MaxPasswordLength
            || !await users.CheckPasswordAsync(user, password))
            return BadRequest(new ApiError(ErrorCodes.PasswordIncorrect, "Password is incorrect.").Body());

        var entry = await ActivityLog.ForAccountAsync(db, logger, user.Id);

        var result = await KeepOnDelete.DeleteAccountAsync(db, users, user);
        if (!result.Succeeded)
            return BadRequest(AuthHelpers.IdentityError(result).Body());

        await ActivityLog.SaveAsync(db, logger, entry);

        await signIn.SignOutAsync();
        return NoContent();
    }
}