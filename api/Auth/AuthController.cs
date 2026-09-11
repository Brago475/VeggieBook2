using System.Net.Mail;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Account endpoints.
//
//   POST /api/auth/register   create an account and sign in
//   POST /api/auth/signin     sign in
//   POST /api/auth/signout    sign out this device
//   GET  /api/auth/me         who is signed in (email is null for guests)
//   POST /api/auth/password   change password, signs out other devices
//   POST /api/auth/delete     delete the account and everything in it
//
// Every endpoint takes and returns JSON only. Combined with the SameSite=Lax
// cookie, that means another site cannot submit a form that acts on a
// visitor's account: a cross-site form cannot send JSON, and the browser does
// not attach the cookie to cross-site POSTs.

public record CredentialsRequest(string? Email, string? Password);
public record ChangePasswordRequest(string? CurrentPassword, string? NewPassword);
public record DeleteAccountRequest(string? Password);

[ApiController]
[Route("api/auth")]
public class AuthController(AccountsContext db, IPasswordHasher<AppUser> hasher)
    : ControllerBase
{
    private const int MinPasswordLength = 12;
    private const int MaxPasswordLength = 128;
    private const int MaxFailedSignIns = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    // Same message for an unknown email and a wrong password, so sign-in
    // never reveals which emails have accounts.
    private const string WrongCredentials = "Email or password is incorrect.";

    // Used to spend the same time hashing when the email is unknown, so the
    // response time does not reveal whether an account exists either.
    private static string? dummyHash;

    [HttpPost("register")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> Register([FromBody] CredentialsRequest req)
    {
        var email = req.Email?.Trim() ?? "";
        if (!IsValidEmail(email))
            return BadRequest(new { error = "Enter a valid email address." });

        var passwordError = CheckNewPassword(req.Password);
        if (passwordError is not null)
            return BadRequest(new { error = passwordError });

        // Sign-up does say when an email is taken. Hiding it properly means
        // emailing the address instead, which needs email verification, and
        // that is not built yet. The rate limit keeps this from being used to
        // check emails in bulk.
        var normalized = email.ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.EmailNormalized == normalized))
            return Conflict(new { error = "An account with this email already exists." });

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = email,
            EmailNormalized = normalized,
            SecurityStamp = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = hasher.HashPassword(user, req.Password!);

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Two sign-ups with the same email at the same moment. The
            // database's unique constraint caught the second one.
            return Conflict(new { error = "An account with this email already exists." });
        }

        await StartSession(user);
        return Ok(new { email = user.Email });
    }

    [HttpPost("signin")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> Login([FromBody] CredentialsRequest req)
    {
        var normalized = req.Email?.Trim().ToLowerInvariant() ?? "";
        var password = req.Password ?? "";

        if (normalized.Length == 0 || password.Length == 0
            || password.Length > MaxPasswordLength)
            return Unauthorized(new { error = WrongCredentials });

        var user = await db.Users.FirstOrDefaultAsync(u => u.EmailNormalized == normalized);
        if (user is null)
        {
            dummyHash ??= hasher.HashPassword(new AppUser(), "timing-equalizer");
            hasher.VerifyHashedPassword(new AppUser(), dummyHash, password);
            return Unauthorized(new { error = WrongCredentials });
        }

        // A locked account is refused before the password is checked, so a
        // lockout never confirms whether a guess was right.
        if (user.LockedUntil > DateTime.UtcNow)
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { error = "Too many failed attempts. Try again in 15 minutes." });

        var result = hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed)
        {
            user.FailedSignIns++;
            if (user.FailedSignIns >= MaxFailedSignIns)
            {
                user.LockedUntil = DateTime.UtcNow.Add(LockoutDuration);
                user.FailedSignIns = 0;
            }
            await db.SaveChangesAsync();
            return Unauthorized(new { error = WrongCredentials });
        }

        user.FailedSignIns = 0;
        user.LockedUntil = null;

        // The hasher reports when a stored hash uses older settings. The
        // password is known at this moment, so upgrade the hash in place.
        if (result == PasswordVerificationResult.SuccessRehashNeeded)
            user.PasswordHash = hasher.HashPassword(user, password);

        await db.SaveChangesAsync();
        await StartSession(user);
        return Ok(new { email = user.Email });
    }

    [HttpPost("signout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    // Called when the site loads. Guests get 200 with a null email rather
    // than a 401, so a normal guest visit does not log an error.
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await CurrentUser();
        return Ok(new { email = user?.Email });
    }

    [HttpPost("password")]
    [Authorize]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var user = await CurrentUser();
        if (user is null) return Unauthorized();

        if (!PasswordMatches(user, req.CurrentPassword))
            return BadRequest(new { error = "Current password is incorrect." });

        var passwordError = CheckNewPassword(req.NewPassword);
        if (passwordError is not null)
            return BadRequest(new { error = passwordError });

        user.PasswordHash = hasher.HashPassword(user, req.NewPassword!);

        // A new stamp invalidates every existing session. This device gets a
        // fresh cookie with the new stamp, so only the others are signed out.
        user.SecurityStamp = Guid.NewGuid();
        await db.SaveChangesAsync();
        await StartSession(user);
        return NoContent();
    }

    // Asks for the password again so a device left signed in cannot be used
    // to delete someone's account. Saved books and uploaded covers will
    // reference app_user with ON DELETE CASCADE, so they are removed by the
    // same statement. Other devices are signed out on their next request,
    // because the account their cookie points to no longer exists.
    [HttpPost("delete")]
    [Authorize]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest req)
    {
        var user = await CurrentUser();
        if (user is null) return Unauthorized();

        if (!PasswordMatches(user, req.Password))
            return BadRequest(new { error = "Password is incorrect." });

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    private async Task<AppUser?> CurrentUser()
    {
        var id = AuthSetup.UserId(User);
        return id is null
            ? null
            : await db.Users.FirstOrDefaultAsync(u => u.Id == id.Value);
    }

    private Task StartSession(AppUser user) =>
        HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            AuthSetup.CreatePrincipal(user),
            new AuthenticationProperties { IsPersistent = true });

    private bool PasswordMatches(AppUser user, string? password) =>
        !string.IsNullOrEmpty(password)
        && password.Length <= MaxPasswordLength
        && hasher.VerifyHashedPassword(user, user.PasswordHash, password)
            != PasswordVerificationResult.Failed;

    // Length is the rule that matters. No forced symbols or capitals, in
    // line with current NIST guidance. The upper limit stops someone sending
    // a huge password to make the server hash megabytes of input.
    private static string? CheckNewPassword(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < MinPasswordLength)
            return $"Password must be at least {MinPasswordLength} characters.";
        if (password.Length > MaxPasswordLength)
            return $"Password must be at most {MaxPasswordLength} characters.";
        return null;
    }

    // MailAddress also accepts forms like "Name <a@b.com>". Requiring the
    // parsed address to equal the input rules those out.
    private static bool IsValidEmail(string email) =>
        email.Length is > 0 and <= 254
        && MailAddress.TryCreate(email, out var parsed)
        && parsed.Address == email;
}