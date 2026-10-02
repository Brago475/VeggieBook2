using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 4: the profile.
//
//   GET /api/auth/profile   first and last name, username, email, age range
//   PUT /api/auth/profile   change first and last name, and username
//
// Email and age range are shown but not changed here. The same rules as
// Create Account apply (SignUpRules), except the username can't be left
// blank: an account always keeps one.

[ApiController]
[Route("api/auth/profile")]
[Authorize(Policy = Roles.MemberPolicy)]
[EnableRateLimiting(AuthSetup.RateLimitPolicy)]
public class ProfileController(UserManager<AppUser> users) : ControllerBase
{
    private const string UsernameTaken = "That username is taken. Please pick another one.";

    // The unique index from db/migrations/005_profile.sql.
    private const string DisplayNameIndex = "app_user_display_name_idx";

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        return Ok(ToResponse(user));
    }

    [HttpPut]
    public async Task<IActionResult> Save([FromBody] ProfileRequest req)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var displayName = req.DisplayName?.Trim() ?? "";
        var error = SignUpRules.CheckName(req.FirstName, "first name")
            ?? SignUpRules.CheckName(req.LastName, "last name")
            ?? (displayName.Length == 0 ? "Please enter a username." : null)
            ?? SignUpRules.CheckDisplayName(displayName);
        if (error is not null) return BadRequest(new { error });

        if (await TakenBySomeoneElse(displayName, user.Id))
            return Conflict(new { error = UsernameTaken });

        user.FirstName = req.FirstName!.Trim();
        user.LastName = req.LastName!.Trim();
        user.DisplayName = displayName;

        try
        {
            var result = await users.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { error = AuthHelpers.FirstError(result) });
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } pg
            && pg.ConstraintName == DisplayNameIndex)
        {
            // Someone took the same username at the same moment.
            return Conflict(new { error = UsernameTaken });
        }

        return Ok(ToResponse(user));
    }

    // Ignores capitals, the same way the unique index does. Their own
    // current username doesn't count, so changing only the capitals works.
    private Task<bool> TakenBySomeoneElse(string name, Guid selfId)
    {
        var lower = name.ToLowerInvariant();
        return users.Users.AnyAsync(u =>
            u.Id != selfId && u.DisplayName != null && u.DisplayName.ToLower() == lower);
    }

    private static ProfileResponse ToResponse(AppUser user) =>
        new(user.FirstName, user.LastName, user.DisplayName, user.Email, user.AgeRange);
}

public record ProfileRequest(string? FirstName, string? LastName, string? DisplayName);

public record ProfileResponse(
    string? FirstName,
    string? LastName,
    string? DisplayName,
    string? Email,
    string? AgeRange);