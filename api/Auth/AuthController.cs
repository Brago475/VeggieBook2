using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 1: getting in and out.
//
//   POST /api/auth/register   create an account and sign in
//   POST /api/auth/signin     sign in
//   POST /api/auth/signout    sign out this device (deletes a guest)
//   GET  /api/auth/me         who is here, their roles, and their username
//
// Passwords: PasswordController. Forgot password: RecoveryController.
// Deleting an account: AccountController. Guests: GuestController.
//
// Every endpoint takes and returns JSON only. Combined with the SameSite=Lax
// cookie, another site cannot submit a form that acts on a visitor's account.
//
// The email is not confirmed at sign-up, so a new account can sign in right
// away. Forgot password uses the PIN and security question set here.
//
// A guest who signs up or signs in chooses what happens to their books
// (KeepGuestBooks). Keep: the books move into the account right away.
// Start fresh: the guest and its books are deleted.

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    IPasswordHasher<AppUser> hasher,
    GuestAccounts guests,
    AccountRecovery recovery) : ControllerBase
{
    private const string WrongCredentials = "Email or password is incorrect.";
    private const string EmailTaken =
        "An account with this email already exists. Sign in, or use Forgot password if you need to.";
    private const string UsernameTaken =
        "That username is taken. Please pick another one, or leave it blank and we'll make one for you.";

    // The unique index from db/migrations/005_profile.sql.
    private const string DisplayNameIndex = "app_user_display_name_idx";

    // Used to spend the same time hashing when the email is unknown, so the
    // response time does not reveal whether an account exists.
    private static string? dummyHash;

    [HttpPost("register")]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var current = await users.GetUserAsync(User);
        if (current is not null && !GuestAccounts.IsGuest(current))
            return BadRequest(new { error = "You are already signed in." });

        var guest = current;
        var address = req.Email?.Trim() ?? "";

        // Every field is checked, in the order the form shows them, before
        // anything is saved.
        var error = SignUpRules.CheckName(req.FirstName, "first name")
            ?? SignUpRules.CheckName(req.LastName, "last name")
            ?? (AuthHelpers.IsValidEmail(address) ? null : "Enter a valid email address.")
            ?? AuthHelpers.CheckPasswordLength(req.Password)
            ?? SignUpRules.CheckAgeRange(req.AgeRange)
            ?? AccountRecovery.CheckNewPin(req.Pin)
            ?? AccountRecovery.CheckNewAnswer(req.QuestionId, req.Answer)
            ?? (req.AgreeToTerms == true
                ? null
                : "Please agree to the Terms of Use and Privacy Policy.");
        if (error is not null) return BadRequest(new { error });

        // The username: theirs if they chose one, otherwise a made-up one.
        var displayName = req.DisplayName?.Trim() ?? "";
        if (displayName.Length > 0)
        {
            var nameError = SignUpRules.CheckDisplayName(displayName);
            if (nameError is not null) return BadRequest(new { error = nameError });
            if (await DisplayNameTaken(displayName))
                return Conflict(new { error = UsernameTaken });
        }
        else
        {
            displayName = await NewDisplayName();
        }

        var now = DateTime.UtcNow;
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = address,
            Email = address,
            CreatedAt = now,
            FirstName = req.FirstName!.Trim(),
            LastName = req.LastName!.Trim(),
            DisplayName = displayName,
            AgeRange = req.AgeRange,
            TermsVersion = SignUpRules.TermsVersion,
            TermsAcceptedAt = now
        };

        // The PIN and question go in with the account, in the same save.
        recovery.SetRecovery(user, req.Pin!, req.QuestionId!.Value, req.Answer!);

        IdentityResult created;
        try
        {
            created = await users.CreateAsync(user, req.Password!);
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } pg)
        {
            // Two sign-ups with the same email or username at the same
            // moment. The database's unique index caught the second one.
            return Conflict(new
            {
                error = pg.ConstraintName == DisplayNameIndex ? UsernameTaken : EmailTaken
            });
        }

        if (!created.Succeeded)
        {
            if (created.Errors.Any(e => e.Code is "DuplicateEmail" or "DuplicateUserName"))
                return Conflict(new { error = EmailTaken });
            return BadRequest(new { error = AuthHelpers.FirstError(created) });
        }

        var role = await users.AddToRoleAsync(user, Roles.User);
        if (!role.Succeeded)
            throw new InvalidOperationException(
                "Could not give the new account the User role. Has migration 003 run?");

        if (guest is not null)
        {
            if (req.KeepGuestBooks == true) await guests.MoveBooksAsync(guest.Id, user.Id);
            else await guests.DeleteAsync(guest.Id);
        }

        // Signing in replaces a guest's session with the new account's.
        await signIn.SignInAsync(user, isPersistent: true);
        return Ok(await AuthHelpers.MeFor(users, user));
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

    // Ignores capitals, the same way the unique index does.
    private Task<bool> DisplayNameTaken(string name)
    {
        var lower = name.ToLowerInvariant();
        return users.Users.AnyAsync(u => u.DisplayName != null && u.DisplayName.ToLower() == lower);
    }

    // A few tries at a free made-up name. A clash is very unlikely, and the
    // unique index catches the rare one that slips through.
    private async Task<string> NewDisplayName()
    {
        for (var i = 0; i < 10; i++)
        {
            var name = SignUpRules.GenerateDisplayName();
            if (!await DisplayNameTaken(name)) return name;
        }
        return $"cook_{Guid.NewGuid():N}"[..SignUpRules.MaxDisplayNameLength];
    }

    private ObjectResult TooManyAttempts() =>
        StatusCode(StatusCodes.Status429TooManyRequests,
            new { error = "Too many failed attempts. Try again in 15 minutes." });
}