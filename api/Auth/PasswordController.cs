using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 2: changing the password while signed in.
//
//   POST /api/auth/password   change password
//
// Forgot password lives in RecoveryController (PIN, then security question).
//
// Changing a password replaces the account's security stamp, which signs out
// every other device on its next request.

[ApiController]
[Route("api/auth")]
public class PasswordController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn) : ControllerBase
{
    [HttpPost("password")]
    [Authorize(Policy = Roles.MemberPolicy)]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var current = req.CurrentPassword ?? "";
        if (current.Length == 0 || current.Length > AuthSetup.MaxPasswordLength)
            return BadRequest(new { error = "Current password is incorrect." });

        var passwordError = AuthHelpers.CheckPasswordLength(req.NewPassword);
        if (passwordError is not null)
            return BadRequest(new { error = passwordError });

        if (req.NewPassword == current)
            return BadRequest(new { error = "Your new password can't be the same as your old one." });

        var result = await users.ChangePasswordAsync(user, current, req.NewPassword!);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                error = result.Errors.Any(e => e.Code == "PasswordMismatch")
                    ? "Current password is incorrect."
                    : AuthHelpers.FirstError(result)
            });
        }

        // The stamp changed, so give this device a fresh cookie. Only the
        // other devices are signed out.
        await signIn.RefreshSignInAsync(user);
        return NoContent();
    }
}