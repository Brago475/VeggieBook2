using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VeggieBook.Api.Data;
using VeggieBook.Api.Email;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 1: getting in and out.
//
//   POST /api/auth/register              create an account, sends a confirmation email
//   POST /api/auth/confirm-email         confirm the email from the link
//   POST /api/auth/resend-confirmation   send the confirmation email again
//   POST /api/auth/signin                sign in
//   POST /api/auth/signout               sign out this device (deletes a guest)
//   GET  /api/auth/me                    who is here, and their roles
//
// Passwords: PasswordController. Deleting an account: AccountController.
// Guests: GuestController.
//
// Every endpoint takes and returns JSON only. Combined with the SameSite=Lax
// cookie, another site cannot submit a form that acts on a visitor's account.
//
// Register, resend, and forgot-password always give the same answer whether
// or not the email has an account, so none of them can be used to find out
// who is signed up. The real answer goes to the inbox instead.
//
// A guest who signs up or signs in chooses what happens to their books
// (KeepGuestBooks). Keep: the books move into the account, on sign in right
// away, on sign up once the email is confirmed. Start fresh: the guest and
// its books are deleted.

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    IPasswordHasher<AppUser> hasher,
    GuestAccounts guests,
    AuthLinks links,
    EmailQueue email) : ControllerBase
{
    private const string WrongCredentials = "Email or password is incorrect.";
    private const string InvalidLink = "This link is invalid or has expired.";

    // Used to spend the same time hashing when the email is unknown, so the
    // response time does not reveal whether an account exists.
    private static string? dummyHash;

    [HttpPost("register")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> Register([FromBody] CredentialsRequest req)
    {
        var current = await users.GetUserAsync(User);
        if (current is not null && !GuestAccounts.IsGuest(current))
            return BadRequest(new { error = "You are already signed in." });

        var guest = current;
        var keepBooks = guest is not null && req.KeepGuestBooks == true;

        var address = req.Email?.Trim() ?? "";
        if (!AuthHelpers.IsValidEmail(address))
            return BadRequest(new { error = "Enter a valid email address." });

        var passwordError = AuthHelpers.CheckPasswordLength(req.Password);
        if (passwordError is not null)
            return BadRequest(new { error = passwordError });

        var existing = await users.FindByEmailAsync(address);
        if (existing is not null)
        {
            // Hash anyway so this path takes as long as a real sign-up.
            hasher.HashPassword(existing, req.Password!);
            email.Enqueue(EmailTemplates.AlreadyRegistered(
                existing.Email!, links.Home, links.ForgotPassword));

            // Same guest handling as a real sign-up, so the answer looks
            // identical either way.
            if (guest is not null && !keepBooks) await DiscardGuest(guest);
            return CheckYourEmail();
        }

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = address,
            Email = address,
            CreatedAt = DateTime.UtcNow,
            PendingGuestId = keepBooks ? guest!.Id : null
        };

        IdentityResult created;
        try
        {
            created = await users.CreateAsync(user, req.Password!);
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Two sign-ups with the same email at the same moment. The
            // database's unique index caught the second one.
            if (guest is not null && !keepBooks) await DiscardGuest(guest);
            return CheckYourEmail();
        }

        if (!created.Succeeded)
            return BadRequest(new { error = AuthHelpers.FirstError(created) });

        var role = await users.AddToRoleAsync(user, Roles.User);
        if (!role.Succeeded)
            throw new InvalidOperationException(
                "Could not give the new account the User role. Has migration 003 run?");

        await SendConfirmation(user);

        if (guest is not null)
        {
            // Keep: the guest stays signed in, and lasts until the email is
            // confirmed. Start fresh: the guest is gone now.
            if (keepBooks) await guests.ExtendAsync(guest);
            else await DiscardGuest(guest);
        }

        return CheckYourEmail();
    }

    // Confirming does not sign the user in. They sign in normally afterward,
    // so a leaked link can never be used as a way into the account.
    [HttpPost("confirm-email")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest req)
    {
        var token = AuthHelpers.DecodeToken(req.Token);
        var user = Guid.TryParse(req.UserId, out _)
            ? await users.FindByIdAsync(req.UserId!)
            : null;

        if (user is null || token is null || GuestAccounts.IsGuest(user))
            return BadRequest(new { error = InvalidLink });

        if (user.EmailConfirmed)
            return Ok(new { status = "confirmed" });

        var result = await users.ConfirmEmailAsync(user, token);
        if (!result.Succeeded)
            return BadRequest(new { error = InvalidLink });

        // The owner chose to keep their guest books when signing up.
        if (user.PendingGuestId is Guid guestId)
        {
            await guests.MoveBooksAsync(guestId, user.Id);
            user.PendingGuestId = null;
            await users.UpdateAsync(user);
        }

        return Ok(new { status = "confirmed" });
    }

    [HttpPost("resend-confirmation")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> ResendConfirmation([FromBody] EmailRequest req)
    {
        var address = req.Email?.Trim() ?? "";
        if (AuthHelpers.IsValidEmail(address))
        {
            var user = await users.FindByEmailAsync(address);
            if (user is not null && !user.EmailConfirmed)
                await SendConfirmation(user);
        }
        return CheckYourEmail();
    }

    [HttpPost("signin")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> Login([FromBody] CredentialsRequest req)
    {
        var address = req.Email?.Trim() ?? "";
        var password = req.Password ?? "";

        if (address.Length == 0 || password.Length == 0
            || password.Length > AuthSetup.MaxPasswordLength)
            return Unauthorized(new { error = WrongCredentials });

        // A guest signing in to a real account. Read before signing in,
        // because signing in replaces the session.
        var current = await users.GetUserAsync(User);
        var guest = current is not null && GuestAccounts.IsGuest(current) ? current : null;

        var user = await users.FindByEmailAsync(address);
        if (user is null || GuestAccounts.IsGuest(user))
        {
            dummyHash ??= hasher.HashPassword(new AppUser(), "timing-equalizer");
            hasher.VerifyHashedPassword(new AppUser(), dummyHash, password);
            return Unauthorized(new { error = WrongCredentials });
        }

        // A locked account is refused before the password is checked, so a
        // lockout never confirms whether a guess was right.
        if (await users.IsLockedOutAsync(user))
            return TooManyAttempts();

        if (!user.EmailConfirmed)
        {
            // Only say "confirm your email" to someone who knows the
            // password. Wrong guesses still count toward the lockout.
            if (!await users.CheckPasswordAsync(user, password))
            {
                await users.AccessFailedAsync(user);
                return Unauthorized(new { error = WrongCredentials });
            }
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                error = "Please confirm your email first. Check your inbox for the link.",
                code = "emailNotConfirmed"
            });
        }

        var result = await signIn.PasswordSignInAsync(
            user, password, isPersistent: true, lockoutOnFailure: true);

        if (result.IsLockedOut) return TooManyAttempts();
        if (!result.Succeeded) return Unauthorized(new { error = WrongCredentials });

        // Signed in. The password proved who they are, so a guest's books
        // can move right away.
        if (guest is not null)
        {
            if (req.KeepGuestBooks == true) await guests.MoveBooksAsync(guest.Id, user.Id);
            else await guests.DeleteAsync(guest.Id);
        }

        return Ok(await AuthHelpers.MeFor(users, user));
    }

    // Signing out a guest deletes the guest and everything in it.
    [HttpPost("signout")]
    public async Task<IActionResult> Logout()
    {
        var current = await users.GetUserAsync(User);
        await signIn.SignOutAsync();

        if (current is not null && GuestAccounts.IsGuest(current))
            await guests.DeleteAsync(current.Id);

        return NoContent();
    }

    // Called when the site loads. Visitors get 200 with no email and no
    // roles rather than a 401, so a normal visit does not log an error.
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await users.GetUserAsync(User);
        return Ok(user is null
            ? new MeResponse(null, [])
            : await AuthHelpers.MeFor(users, user));
    }

    private async Task DiscardGuest(AppUser guest)
    {
        await signIn.SignOutAsync();
        await guests.DeleteAsync(guest.Id);
    }

    private async Task SendConfirmation(AppUser user)
    {
        var token = await users.GenerateEmailConfirmationTokenAsync(user);
        email.Enqueue(EmailTemplates.ConfirmEmail(
            user.Email!, links.ConfirmEmail(user.Id, token)));
    }

    private AcceptedResult CheckYourEmail() =>
        Accepted(new { status = "checkEmail" });

    private ObjectResult TooManyAttempts() =>
        StatusCode(StatusCodes.Status429TooManyRequests,
            new { error = "Too many failed attempts. Try again in 15 minutes." });
}