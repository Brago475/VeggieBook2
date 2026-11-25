using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.SuperTracker;

// SuperTracker2 setup for the signed-in account. Not research tracked.
// Real accounts only: a guest gets 403 with code "accountRequired".
//
//   GET  /api/supertracker/me        Terms status and the saved profile
//   POST /api/supertracker/terms     { version }
//   PUT  /api/supertracker/profile   { age, sex, heightCm, weightKg, activity, units, calorieGoal }
//
// While SuperTrackerRules.RequireTerms is on, the profile can be saved
// only after the current Terms are accepted.

public record TermsRequest(string? Version);

public record ProfileRequest(
    int? Age,
    string? Sex,
    decimal? HeightCm,
    decimal? WeightKg,
    string? Activity,
    string? Units,
    int? CalorieGoal);

[ApiController]
[Route("api/supertracker")]
[Authorize]
public class SuperTrackerController(SuperTrackerContext db, AccountsContext accounts) : ControllerBase
{
    private Guid CurrentUserId =>
        AuthSetup.UserId(User) ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var uid = CurrentUserId;
        if (await IsGuestAsync(uid)) return AccountRequired();

        var accepted = await HasAcceptedAsync(uid);
        var profile = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == uid);

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            termsVersion = SuperTrackerRules.TermsVersion,
            termsRequired = SuperTrackerRules.RequireTerms,
            termsAccepted = accepted,
            profile = profile is null ? null : View(profile)
        });
    }

    [HttpPost("terms")]
    public async Task<IActionResult> AcceptTerms([FromBody] TermsRequest req)
    {
        var uid = CurrentUserId;
        if (await IsGuestAsync(uid)) return AccountRequired();

        if (req.Version != SuperTrackerRules.TermsVersion)
            return BadRequest(new { error = "These terms have changed. Please read them again.", code = "outdatedTerms" });

        if (!await HasAcceptedAsync(uid))
        {
            db.TermsAcceptances.Add(new St2TermsAcceptance
            {
                UserId = uid,
                Version = SuperTrackerRules.TermsVersion,
                AcceptedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpPut("profile")]
    public async Task<IActionResult> SaveProfile([FromBody] ProfileRequest req)
    {
        var uid = CurrentUserId;
        if (await IsGuestAsync(uid)) return AccountRequired();

        if (SuperTrackerRules.RequireTerms && !await HasAcceptedAsync(uid))
            return Conflict(new { error = "Please accept the SuperTracker2 terms first.", code = "termsRequired" });

        if (SuperTrackerRules.InvalidField(req) is string field)
            return BadRequest(new { error = "Please check your answers.", code = "invalidProfile", field });

        var now = DateTime.UtcNow;
        var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == uid);
        if (profile is null)
        {
            profile = new St2Profile { UserId = uid, CreatedAt = now };
            db.Profiles.Add(profile);
        }

        profile.Age = (short)req.Age!.Value;
        profile.Sex = req.Sex!;
        profile.HeightCm = Math.Round(req.HeightCm!.Value, 1);
        profile.WeightKg = Math.Round(req.WeightKg!.Value, 1);
        profile.Activity = req.Activity!;
        profile.Units = req.Units ?? "us";
        profile.CalorieGoal = req.CalorieGoal is int c ? (short)c : null;
        profile.UpdatedAt = now;

        await db.SaveChangesAsync();
        return Ok(View(profile));
    }

    private async Task<bool> IsGuestAsync(Guid uid)
    {
        var user = await accounts.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == uid);
        return user is null || GuestAccounts.IsGuest(user);
    }

    private ObjectResult AccountRequired() =>
        StatusCode(403, new { error = "SuperTracker2 needs an account.", code = "accountRequired" });

    private Task<bool> HasAcceptedAsync(Guid uid) =>
        db.TermsAcceptances.AnyAsync(t => t.UserId == uid && t.Version == SuperTrackerRules.TermsVersion);

    private static object View(St2Profile p) => new
    {
        age = p.Age,
        sex = p.Sex,
        heightCm = p.HeightCm,
        weightKg = p.WeightKg,
        activity = p.Activity,
        units = p.Units,
        calorieGoal = p.CalorieGoal,
        updatedAt = p.UpdatedAt
    };
}