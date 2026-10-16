using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The admin site's Settings.
//
// Any admin:
//   GET  /api/admin/settings                  accounts, guests, research, system, you
//   PUT  /api/admin/settings/guests           turn guest visits on or off
//   GET  /api/admin/settings/guests.csv       guest visits per day
//   POST /api/admin/settings/signout-everywhere
//
// Root admin only:
//   GET  /api/admin/settings/admins           every admin
//   POST /api/admin/settings/admins           make an account an admin, by email
//   GET  /api/admin/settings/identity         email, username, date made (recorded)
//   GET  /api/admin/settings/identity/{id}/research-id
//                                             one research ID, on request (recorded)
//   GET  /api/admin/settings/identity/history the latest recorded opens and reveals
//
// Opening Identity records and revealing a research ID are written to the
// identity history (IdentityAudit.cs). If that write fails, nothing is shown.
//
// Removing an admin: DELETE /api/admin/accounts/{id}/admin (root only).
// Account counts leave admins out for every admin but the root admin.
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
    IConfiguration config,
    ILogger<AdminSettingsController> logger) : ControllerBase
{
    private const int GuestDays = 14;
    private const int HistoryTake = 100;
    private const string NotRecorded = "This could not be recorded in the identity history, so it was not shown. Has migration 012 run?";

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var me = await users.GetUserAsync(User);
        if (me is null) return Unauthorized();

        var root = AdminRules.IsRoot(config, me.Email);
        var now = DateTime.UtcNow;
        var nowOffset = DateTimeOffset.UtcNow;
        var weekAgo = now.AddDays(-7);
        var adminRoleId = await AdminRoleId();

        var people = db.Users.AsNoTracking().Where(u => u.GuestExpiresAt == null);
        if (!root)
            people = people.Where(u => !db.UserRoles.Any(r => r.UserId == u.Id && r.RoleId == adminRoleId));

        var today = SiteSettings.Today();
        var from = today.AddDays(-(GuestDays - 1));
        var days = await SiteSettings.GuestDaysAsync(db, from);
        var daily = Enumerable.Range(0, GuestDays)
            .Select(i => from.AddDays(i))
            .Select(d => new { day = d.ToString("yyyy-MM-dd"), visits = days.GetValueOrDefault(d) })
            .ToList();

        var allAccounts = await db.Users.CountAsync(u => u.GuestExpiresAt == null);
        var accepted = await db.Users.CountAsync(u => u.GuestExpiresAt == null && u.TermsVersion == SignUpRules.TermsVersion);
        var running = await db.Studies.AsNoTracking().Where(s => s.EndedAt == null)
            .OrderByDescending(s => s.Number)
            .Select(s => new { s.Number, s.Name })
            .FirstOrDefaultAsync();

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            me = new { email = me.Email, isRoot = root },
            accounts = new
            {
                total = await people.CountAsync(),
                newThisWeek = await people.CountAsync(u => u.CreatedAt >= weekAgo),
                resetLocked = await people.CountAsync(u => u.RecoveryLockedAt != null),
                signInLocked = await people.CountAsync(u => u.LockoutEnd != null && u.LockoutEnd > nowOffset)
            },
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
                accounts = allAccounts
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
        var me = await users.GetUserAsync(User);
        if (me is null) return Unauthorized();

        if (!await Record(IdentityAudit.Opened, me.Email, null))
            return StatusCode(500, new { error = NotRecorded });

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
        var me = await users.GetUserAsync(User);
        if (me is null) return Unauthorized();

        var exists = await db.Users.AnyAsync(u => u.Id == id && u.GuestExpiresAt == null);
        if (!exists) return NotFound();

        var adminRoleId = await AdminRoleId();
        if (await db.UserRoles.AnyAsync(r => r.UserId == id && r.RoleId == adminRoleId))
            return Ok(new { researchId = (string?)null, note = "Admins are never tracked, so they have no research ID." });

        var ids = await ParticipantIds.EnsureAsync(db);
        var researchId = ids.GetValueOrDefault(id);

        // Only an actual reveal is recorded; nothing is shown if it can't be.
        if (researchId is not null && !await Record(IdentityAudit.Revealed, me.Email, id))
            return StatusCode(500, new { error = NotRecorded });

        Response.Headers.CacheControl = "no-store";
        return Ok(new { researchId, note = (string?)null });
    }

    [HttpGet("identity/history")]
    [RootAdminOnly]
    public async Task<IActionResult> IdentityHistory()
    {
        List<IdentityAuditRow> rows;
        try
        {
            rows = await IdentityAudit.LatestAsync(db, HistoryTake);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Identity history: could not load.");
            return StatusCode(500, new { error = "The history could not be loaded. Has migration 012 run?" });
        }

        var targets = rows
            .Where(r => r.TargetUserId != null)
            .Select(r => r.TargetUserId!.Value)
            .Distinct()
            .ToList();

        var emails = await db.Users
            .AsNoTracking()
            .Where(u => targets.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Email);

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            limit = HistoryTake,
            entries = rows.Select(r => new
            {
                at = r.At,
                action = r.Action,
                adminEmail = r.AdminEmail,
                targetEmail = r.TargetUserId is Guid t ? emails.GetValueOrDefault(t) : null,
                targetDeleted = r.TargetUserId is Guid g && !emails.ContainsKey(g)
            })
        });
    }

    private async Task<bool> Record(string action, string? adminEmail, Guid? target)
    {
        try
        {
            await IdentityAudit.RecordAsync(db, action, adminEmail ?? "", target);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Identity history: could not record {Action}.", action);
            return false;
        }
    }

    private async Task<Guid> AdminRoleId() =>
        await db.Roles.Where(r => r.Name == Roles.Admin).Select(r => r.Id).FirstAsync();
}