using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VeggieBook.Api.Data;
using VeggieBook.Api.Email;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 2: passwords.
//
//   POST /api/auth/password          change password while signed in
//   POST /api/auth/forgot-password   email a reset link
//   POST /api/auth/reset-password    set a new password from the link
//
// Changing or resetting a password replaces the account's security stamp,
// which signs out every other device on its next request.

[ApiController]
[Route("api/auth")]
public class PasswordController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    AuthLinks links,
    EmailQueue email) : ControllerBase
{
    private const string InvalidLink = "This link is invalid or has expired.";

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

    // Always the same answer, so it cannot reveal who has an account.
    [HttpPost("forgot-password")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> ForgotPassword([FromBody] EmailRequest req)
    {
        var address = req.Email?.Trim() ?? "";
        if (AuthHelpers.IsValidEmail(address))
        {
            var user = await users.FindByEmailAsync(address);
            if (user is not null && !GuestAccounts.IsGuest(user))
            {
                if (user.EmailConfirmed)
                {
                    var token = await users.GeneratePasswordResetTokenAsync(user);
                    email.Enqueue(EmailTemplates.ResetPassword(
                        user.Email!, links.ResetPassword(user.Id, token)));
                }
                else
                {
                    // Never confirmed: send the confirmation link instead.
                    var token = await users.GenerateEmailConfirmationTokenAsync(user);
                    email.Enqueue(EmailTemplates.ConfirmEmail(
                        user.Email!, links.ConfirmEmail(user.Id, token)));
                }
            }
        }
        return Accepted(new { status = "checkEmail" });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var passwordError = AuthHelpers.CheckPasswordLength(req.NewPassword);
        if (passwordError is not null)
            return BadRequest(new { error = passwordError });

        var token = AuthHelpers.DecodeToken(req.Token);
        var user = Guid.TryParse(req.UserId, out _)
            ? await users.FindByIdAsync(req.UserId!)
            : null;

        if (user is null || token is null || GuestAccounts.IsGuest(user))
            return BadRequest(new { error = InvalidLink });

        var result = await users.ResetPasswordAsync(user, token, req.NewPassword!);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                error = result.Errors.Any(e => e.Code == "InvalidToken")
                    ? InvalidLink
                    : AuthHelpers.FirstError(result)
            });
        }

        // Whoever reset the password owns the inbox, so clear any lockout.
        await users.SetLockoutEndDateAsync(user, null);
        await users.ResetAccessFailedCountAsync(user);
        return NoContent();
    }
}