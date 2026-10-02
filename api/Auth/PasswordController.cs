using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 2: changing the password while signed in.
//
//   POST /api/auth/password/verify   current password OR recovery PIN,
//                                    gives a short ticket
//   POST /api/auth/password          ticket + new password
//
// Two steps so the new password is only asked for once the person has
// proved it's them. The PIN shares its 3 tries a day with Forgot password
// (see AccountRecovery), so this is not a way around that limit.
//
// The ticket is Identity's password reset token. It is tied to the
// account's security stamp, so it works once, and expires after 15 minutes
// (see AuthSetup).
//
// Changing a password replaces the security stamp, which signs out every
// other device on its next request. This device gets a fresh cookie.
//
// Forgot password, while signed out, lives in RecoveryController.

[ApiController]
[Route("api/auth")]
[Authorize(Policy = Roles.MemberPolicy)]
[EnableRateLimiting(AuthSetup.RateLimitPolicy)]
public class PasswordController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    AccountRecovery recovery) : ControllerBase
{
    private const string TicketExpired = "This took too long. Please start again.";

    [HttpPost("password/verify")]
    public async Task<IActionResult> Verify([FromBody] PasswordVerifyRequest req)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        // The PIN, when they don't remember the current password.
        if (!string.IsNullOrEmpty(req.Pin))
        {
            if (AccountRecovery.IsLocked(user))
                return StatusCode(StatusCodes.Status423Locked,
                    new { status = "locked", error = AccountRecovery.LockedMessage });

            var now = DateTime.UtcNow;
            if (AccountRecovery.PinTriesUsedUp(user, now)) return PinClosed();

            if (recovery.PinMatches(user, req.Pin))
                return Ok(await Ticket(user));

            AccountRecovery.RecordPinFailure(user, now);
            await users.UpdateAsync(user);
            return AccountRecovery.PinTriesUsedUp(user, now)
                ? PinClosed()
                : BadRequest(new { error = "That PIN is not right. Please try again." });
        }

        // The current password. Wrong ones count toward the sign-in lockout.
        var current = req.CurrentPassword ?? "";
        if (current.Length == 0 || current.Length > AuthSetup.MaxPasswordLength)
            return BadRequest(new { error = "Current password is incorrect." });

        var check = await signIn.CheckPasswordSignInAsync(user, current, lockoutOnFailure: true);
        if (check.IsLockedOut)
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { error = "Too many wrong passwords. Please try again in 15 minutes." });
        if (!check.Succeeded)
            return BadRequest(new { error = "Current password is incorrect." });

        return Ok(await Ticket(user));
    }

    [HttpPost("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var token = AuthHelpers.DecodeToken(req.Ticket);
        if (token is null) return BadRequest(new { error = TicketExpired });

        // The ticket first, so nothing below can be tried without one.
        var ticketOk = await users.VerifyUserTokenAsync(
            user,
            users.Options.Tokens.PasswordResetTokenProvider,
            UserManager<AppUser>.ResetPasswordTokenPurpose,
            token);
        if (!ticketOk) return BadRequest(new { error = TicketExpired });

        var passwordError = AuthHelpers.CheckPasswordLength(req.NewPassword);
        if (passwordError is not null) return BadRequest(new { error = passwordError });

        if (await users.CheckPasswordAsync(user, req.NewPassword!))
            return BadRequest(new { error = "Your new password can't be the same as your old one." });

        var result = await users.ResetPasswordAsync(user, token, req.NewPassword!);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                error = result.Errors.Any(e => e.Code == "InvalidToken")
                    ? TicketExpired
                    : AuthHelpers.FirstError(result)
            });
        }

        // The stamp changed, so give this device a fresh cookie. Only the
        // other devices are signed out.
        await signIn.RefreshSignInAsync(user);
        return NoContent();
    }

    private async Task<object> Ticket(AppUser user) =>
        new { ticket = AuthHelpers.EncodeToken(await users.GeneratePasswordResetTokenAsync(user)) };

    private ObjectResult PinClosed() =>
        StatusCode(StatusCodes.Status429TooManyRequests,
            new
            {
                status = "pinClosed",
                error = "Too many wrong PINs today. Please use your current password, or try again tomorrow."
            });
}