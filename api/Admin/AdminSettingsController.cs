using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The admin site's Site settings.
//
// Any admin:
//   GET  /api/admin/settings                  guests, research, system, you
//   PUT  /api/admin/settings/guests           turn guest visits on or off
//   GET  /api/admin/settings/guests.csv       guest visits per day
//   POST /api/admin/settings/signout-everywhere
//
// Root admin only:
//   GET  /api/admin/settings/admins           every admin
//   POST /api/admin/settings/admins           make an account an admin, by email
//   GET  /api/admin/settings/identity         email, username, date made
//   GET  /api/admin/settings/identity/{id}/research-id
//                                             one research ID, on request
//
// Removing an admin: DELETE /api/admin/accounts/{id}/admin (root only).
// Guest counts are numbers per day only; no guest is tracked.

public record GuestsRequest(bool Allowed);
public record AddAdminRequest(string? Email);

[ApiController]
[Route("api/admin/settings")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminSettingsController(
    AccountsContext db,
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    IConfiguration config) : ControllerBase
{
    private const int GuestDays = 14;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var me = await users.GetUserAsync(User);
        if (me is null) return Unauthorized();

        var now = DateTime.UtcNow;
        var today = SiteSettings.Today();
        var from = today.AddDays(-(GuestDays - 1));
        var days = await SiteSettings.GuestDaysAsync(db, from);
        var daily = Enumerable.Range(0, GuestDays)
            .Select(i => from.AddDays(i))
            .Select(d => new { day = d.ToString("yyyy-MM-dd"), visits = days.GetValueOrDefault(d) })
            .ToList();

        var accounts = await db.Users.CountAsync(u => u.GuestExpiresAt == null);
        var accepted = await db.Users.CountAsync(u => u.GuestExpiresAt == null && u.TermsVersion == SignUpRules.TermsVersion);
        var running = await db.Studies.AsNoTracking().Where(s => s.EndedAt == null)
            .OrderByDescending(s => s.Number)
            .Select(s => new { s.Number, s.Name })
            .FirstOrDefaultAsync();

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            me = new { email = me.Email, isRoot = AdminRules.IsRoot(config, me.Email) },
            guests = new
            {
                allowed = await SiteSettings.GuestsAllowedAsync(db),
                today = days.GetValueOrDefault(today),
                last7 = daily.TakeLast(7).Sum(d => d.visits),
                insideNow = await db.Users.CountAsync(u => u.GuestExpiresAt != null && u.GuestExpiresAt > now),
                lifetimeHours = (int)GuestAccounts.Lifetime.TotalHours,
                daily
            },
            research = new
            {
                termsVersion = SignUpRules.TermsVersion,
                termsAccepted = accepted,
                accounts
            },
            system = new
            {
                database = await db.Database.CanConnectAsync(),
                study = running is null ? null : new { number = running.Number, name = running.Name },
                lastBookAt = await db.Books.MaxAsync(b => (DateTime?)b.CreatedAt)
            }
        });
    }

    [HttpPut("guests")]
    public async Task<IActionResult> SetGuests([FromBody] GuestsRequest req)
    {
        try
        {
            await SiteSettings.SetGuestsAllowedAsync(db, req.Allowed, AuthSetup.UserId(User));
        }
        catch
        {
            return StatusCode(500, new { error = "The setting could not be saved. Has migration 011 run?" });
        }
        return NoContent();
    }

    [HttpGet("guests.csv")]
    public async Task<IActionResult> GuestsCsv()
    {
        var days = await SiteSettings.GuestDaysAsync(db);
        var csv = new StringBuilder("date,guest_visits\n");
        foreach (var (day, count) in days.OrderBy(d => d.Key))
            csv.Append(day.ToString("yyyy-MM-dd")).Append(',').Append(count).Append('\n');

        Response.Headers.CacheControl = "no-store";
        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv; charset=utf-8",
            $"veggiebook2-guest-visits-{SiteSettings.Today():yyyy-MM-dd}.csv");
    }

    // Signs this admin out everywhere, including this browser.
    [HttpPost("signout-everywhere")]
    public async Task<IActionResult> SignOutEverywhere()
    {
        var me = await users.GetUserAsync(User);
        if (me is null) return Unauthorized();

        await users.UpdateSecurityStampAsync(me);
        await signIn.SignOutAsync();
        return NoContent();
    }

    // ---- Root admin only ----

    [HttpGet("admins")]
    [RootAdminOnly]
    public async Task<IActionResult> Admins()
    {
        var adminRoleId = await AdminRoleId();
        var me = AuthSetup.UserId(User);

        var rows = await db.Users
            .AsNoTracking()
            .Where(u => db.UserRoles.Any(r => r.UserId == u.Id && r.RoleId == adminRoleId))
            .OrderBy(u => u.CreatedAt)
            .Select(u => new { u.Id, u.Email, u.DisplayName, u.CreatedAt })
            .ToListAsync();

        return Ok(rows.Select(r => new
        {
            id = r.Id,
            email = r.Email,
            username = r.DisplayName,
            createdAt = r.CreatedAt,
            isRoot = AdminRules.IsRoot(config, r.Email),
            isYou = r.Id == me
        }));
    }

    [HttpPost("admins")]
    [RootAdminOnly]
    public async Task<IActionResult> AddAdmin([FromBody] AddAdminRequest req)
    {
        var email = (req.Email ?? "").Trim();
        if (email.Length == 0) return BadRequest(new { error = "Enter the account's email." });

        var user = await users.FindByEmailAsync(email);
        if (user is null || GuestAccounts.IsGuest(user))
            return NotFound(new { error = "No account uses this email." });

        if (!await users.IsInRoleAsync(user, Roles.User))
            return Conflict(new { error = "Only a full account can be made an admin." });

        if (await users.IsInRoleAsync(user, Roles.Admin))
            return Conflict(new { error = "This account is already an admin." });

        var result = await users.AddToRoleAsync(user, Roles.Admin);
        if (!result.Succeeded)
            return StatusCode(500, new { error = "The role could not be added. Please try again." });

        return NoContent();
    }

    [HttpGet("identity")]
    [RootAdminOnly]
    public async Task<IActionResult> Identity()
    {
        var adminRoleId = await AdminRoleId();

        var rows = await db.Users
            .AsNoTracking()
            .Where(u => u.GuestExpiresAt == null)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                id = u.Id,
                email = u.Email,
                username = u.DisplayName,
                createdAt = u.CreatedAt,
                isAdmin = db.UserRoles.Any(r => r.UserId == u.Id && r.RoleId == adminRoleId)
            })
            .ToListAsync();

        Response.Headers.CacheControl = "no-store";
        return Ok(rows);
    }

    [HttpGet("identity/{id:guid}/research-id")]
    [RootAdminOnly]
    public async Task<IActionResult> ResearchId(Guid id)
    {
        var exists = await db.Users.AnyAsync(u => u.Id == id && u.GuestExpiresAt == null);
        if (!exists) return NotFound();

        var adminRoleId = await AdminRoleId();
        if (await db.UserRoles.AnyAsync(r => r.UserId == id && r.RoleId == adminRoleId))
            return Ok(new { researchId = (string?)null, note = "Admins are never tracked, so they have no research ID." });

        var ids = await ParticipantIds.EnsureAsync(db);

        Response.Headers.CacheControl = "no-store";
        return Ok(new { researchId = ids.GetValueOrDefault(id), note = (string?)null });
    }

    private async Task<Guid> AdminRoleId() =>
        await db.Roles.Where(r => r.Name == Roles.Admin).Select(r => r.Id).FirstAsync();
}