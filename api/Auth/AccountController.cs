using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 3: deleting an account.
//
//   POST /api/auth/delete   delete the account and everything in it
//
// Real accounts only. A guest is deleted by signing out.
//
// Asks for the password again so a device left signed in cannot be used to
// delete someone's account. Saved books and uploaded covers reference
// app_user with ON DELETE CASCADE, so they are removed by the same statement.
// Other devices are signed out on their next request, because the account
// their cookie points to no longer exists.
//
// The deletion is written to the activity log (Activity/ActivityLog.cs) by
// research ID only. The ID is looked up before deleting, while the account
// still exists, and the line is saved after the delete succeeds. The log
// never blocks the delete.

[ApiController]
[Route("api/auth")]
public class AccountController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    AccountsContext db,
    ILogger<AccountController> logger) : ControllerBase
{
    [HttpPost("delete")]
    [Authorize(Policy = Roles.MemberPolicy)]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest req)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var password = req.Password ?? "";
        if (password.Length == 0 || password.Length > AuthSetup.MaxPasswordLength
            || !await users.CheckPasswordAsync(user, password))
            return BadRequest(new { error = "Password is incorrect." });

        var entry = await ActivityLog.ForAccountAsync(db, logger, user.Id);

        var result = await users.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { error = AuthHelpers.FirstError(result) });

        await ActivityLog.SaveAsync(db, logger, entry);

        await signIn.SignOutAsync();
        return NoContent();
    }
}