using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Forgot password, without email.
//
//   GET  /api/auth/recovery/questions   the questions offered for new picks
//   POST /api/auth/recovery/question    the question for an email
//   POST /api/auth/recovery/pin         email + PIN, gives a reset ticket
//   POST /api/auth/recovery/answer      email + answer, gives a reset ticket
//   POST /api/auth/recovery/reset       ticket + new password, PIN, question
//
//   GET  /api/auth/recovery/settings    signed in: is a PIN and question set
//   PUT  /api/auth/recovery/settings    signed in: set or change them
//
// The rules (3 tries a day, the lock) are in AccountRecovery.cs.
//
// Answers never reveal who has an account: an unknown email gets the same
// "doesn't match" message and a made-up question. The one exception is the
// lock and the closed PIN step, which only show after 3 wrong tries on a
// real account.
//
// The reset ticket is Identity's password reset token. It is tied to the
// account's security stamp, so it works once, and it expires after
// 15 minutes (see AuthSetup).
//
// Messages carry a code the site translates (ErrorCodes, ApiError).

[ApiController]
[Route("api/auth/recovery")]
[EnableRateLimiting(AuthSetup.RateLimitPolicy)]
public class RecoveryController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    AccountRecovery recovery) : ControllerBase
{
    private static readonly ApiError BadEmail =
        new(ErrorCodes.EmailInvalid, "Please enter a valid email.");
    private static readonly ApiError PinMismatch =
        new(ErrorCodes.PinMismatch, "That email and PIN don't match.");
    private static readonly ApiError AnswerMismatch =
        new(ErrorCodes.AnswerMismatch, "That answer doesn't match.");
    private static readonly ApiError InvalidTicket =
        new(ErrorCodes.ResetExpired, "This reset has expired. Please start again.");
    private static readonly ApiError CurrentPasswordIncorrect =
        new(ErrorCodes.CurrentPasswordIncorrect, "Current password is incorrect.");

    [HttpGet("questions")]
    public IActionResult Questions() => Ok(RecoveryQuestions.Active);

    [HttpPost("question")]
    public async Task<IActionResult> Question([FromBody] EmailRequest req)
    {
        var (address, user) = await FindAccount(req.Email);
        if (address is null) return BadRequest(BadEmail.Body());
        if (user is not null && AccountRecovery.IsLocked(user)) return Locked();

        var question = user?.SecurityQuestionId is int id && RecoveryQuestions.Exists(id)
            ? RecoveryQuestions.Get(id)
            : RecoveryQuestions.StandIn(address);
        return Ok(question);
    }

    [HttpPost("pin")]
    public async Task<IActionResult> Pin([FromBody] RecoveryPinRequest req)
    {
        var (address, user) = await FindAccount(req.Email);
        if (address is null) return BadRequest(BadEmail.Body());
        if (user is null)
        {
            recovery.BurnTime();
            return BadRequest(PinMismatch.Body());
        }
        if (AccountRecovery.IsLocked(user)) return Locked();

        var now = DateTime.UtcNow;
        if (AccountRecovery.PinTriesUsedUp(user, now)) return PinClosed();

        if (recovery.PinMatches(user, req.Pin))
            return Ok(await Ticket(user));

        AccountRecovery.RecordPinFailure(user, now);
        await users.UpdateAsync(user);
        return AccountRecovery.PinTriesUsedUp(user, now)
            ? PinClosed()
            : BadRequest(PinMismatch.Body());
    }

    [HttpPost("answer")]
    public async Task<IActionResult> Answer([FromBody] RecoveryAnswerRequest req)
    {
        var (address, user) = await FindAccount(req.Email);
        if (address is null) return BadRequest(BadEmail.Body());
        if (user is null)
        {
            recovery.BurnTime();
            return BadRequest(AnswerMismatch.Body());
        }
        if (AccountRecovery.IsLocked(user)) return Locked();

        if (recovery.AnswerMatches(user, req.Answer))
            return Ok(await Ticket(user));

        AccountRecovery.RecordAnswerFailure(user, DateTime.UtcNow);
        await users.UpdateAsync(user);
        return AccountRecovery.IsLocked(user)
            ? Locked()
            : BadRequest(AnswerMismatch.Body());
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset([FromBody] RecoveryResetRequest req)
    {
        var (_, user) = await FindAccount(req.Email);
        var token = AuthHelpers.DecodeToken(req.Ticket);
        if (user is null || token is null) return BadRequest(InvalidTicket.Body());
        if (AccountRecovery.IsLocked(user)) return Locked();

        // The ticket first, so nothing below can be tried without one.
        var ticketOk = await users.VerifyUserTokenAsync(
            user,
            users.Options.Tokens.PasswordResetTokenProvider,
            UserManager<AppUser>.ResetPasswordTokenPurpose,
            token);
        if (!ticketOk) return BadRequest(InvalidTicket.Body());

        var error = AuthHelpers.CheckPasswordLength(req.NewPassword)
            ?? AccountRecovery.CheckNewPin(req.NewPin)
            ?? AccountRecovery.CheckNewAnswer(req.QuestionId, req.Answer);
        if (error is not null) return BadRequest(error.Body());

        if (await users.CheckPasswordAsync(user, req.NewPassword!))
            return BadRequest(new ApiError(ErrorCodes.PasswordSame,
                "Your new password can't be the same as your old one.").Body());

        // Saves the new password and a new security stamp, which uses up the
        // ticket and signs out every other device.
        var result = await users.ResetPasswordAsync(user, token, req.NewPassword!);
        if (!result.Succeeded)
        {
            return BadRequest((result.Errors.Any(e => e.Code == "InvalidToken")
                ? InvalidTicket
                : AuthHelpers.IdentityError(result)).Body());
        }

        recovery.SetRecovery(user, req.NewPin!, req.QuestionId!.Value, req.Answer!);
        await users.UpdateAsync(user);

        // They proved it's their account, so clear any sign-in lockout too.
        await users.SetLockoutEndDateAsync(user, null);
        await users.ResetAccessFailedCountAsync(user);
        return NoContent();
    }

    [HttpGet("settings")]
    [Authorize(Policy = Roles.MemberPolicy)]
    public async Task<IActionResult> GetSettings()
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var question = user.SecurityQuestionId is int id && RecoveryQuestions.Exists(id)
            ? RecoveryQuestions.Get(id).Text
            : null;
        return Ok(new RecoverySettingsResponse(
            user.RecoveryPinHash is not null, user.SecurityQuestionId, question));
    }

    // Needs the current password. Setting a new PIN and question also clears
    // a lock, since knowing the password proves it's their account.
    [HttpPut("settings")]
    [Authorize(Policy = Roles.MemberPolicy)]
    public async Task<IActionResult> SetSettings([FromBody] RecoverySettingsRequest req)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var current = req.CurrentPassword ?? "";
        if (current.Length == 0 || current.Length > AuthSetup.MaxPasswordLength)
            return BadRequest(CurrentPasswordIncorrect.Body());

        var error = AccountRecovery.CheckNewPin(req.Pin)
            ?? AccountRecovery.CheckNewAnswer(req.QuestionId, req.Answer);
        if (error is not null) return BadRequest(error.Body());

        var check = await signIn.CheckPasswordSignInAsync(user, current, lockoutOnFailure: true);
        if (check.IsLockedOut)
            return BadRequest(new ApiError(ErrorCodes.TooManyWrongPasswords,
                "Too many wrong passwords. Please try again in 15 minutes.").Body());
        if (!check.Succeeded)
            return BadRequest(CurrentPasswordIncorrect.Body());

        recovery.SetRecovery(user, req.Pin!, req.QuestionId!.Value, req.Answer!);
        var result = await users.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(AuthHelpers.IdentityError(result).Body());
        return NoContent();
    }

    // Guests never have recovery, so they count as "no account".
    private async Task<(string? Address, AppUser? User)> FindAccount(string? email)
    {
        var address = email?.Trim() ?? "";
        if (!AuthHelpers.IsValidEmail(address)) return (null, null);
        var user = await users.FindByEmailAsync(address);
        return (address, user is null || GuestAccounts.IsGuest(user) ? null : user);
    }

    private async Task<object> Ticket(AppUser user) =>
        new { ticket = AuthHelpers.EncodeToken(await users.GeneratePasswordResetTokenAsync(user)) };

    private ObjectResult Locked() =>
        StatusCode(StatusCodes.Status423Locked, AccountRecovery.Locked.Body());

    private ObjectResult PinClosed() =>
        StatusCode(StatusCodes.Status429TooManyRequests,
            new ApiError(ErrorCodes.PinClosedForgot,
                "Too many wrong PINs today. Please answer your security question instead.")
            { Status = "pinClosed" }.Body());
}