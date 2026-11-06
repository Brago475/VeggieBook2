using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Notifications;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Admin;

// The Notifications page.
//
//   GET  /api/admin/notifications            every notification, newest first,
//                                            with its status and counts
//   GET  /api/admin/notifications/templates  the templates and vegetables
//   GET  /api/admin/notifications/people     research IDs that can be picked
//   POST /api/admin/notifications            create
//   PUT  /api/admin/notifications/{id}       edit text, dates, repeat, audience
//   POST /api/admin/notifications/{id}/stop  stop now; a stopped message
//                                            can't be edited
//
// Start times: StartNow uses the server's clock at the moment of saving. A
// requested start that has already passed also starts now, except the
// unchanged start of a message that has already started, which is kept.
//
// Admins only. Accounts are chosen by research ID; no email or username is
// read or sent. Counts are people (distinct accounts), guests included.
// Every create, edit and stop is written to the activity log.

public record NotificationRequest(
    string? BodyEn,
    string? TemplateKey,
    string? Vegetable,
    DateTimeOffset? StartsAt,
    DateTimeOffset? ExpiresAt,
    int? RepeatDays,
    string? Audience,
    bool? IncludeGuests,
    List<string>? IncludeIds,
    List<string>? ExcludeIds,
    bool? StartNow);

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminNotificationsController(
    AccountsContext db,
    UserManager<AppUser> users,
    ILogger<AdminNotificationsController> logger) : ControllerBase
{
    private const int MaxBody = 500;
    private const int MaxRepeatDays = 365;

    private sealed record Parsed(
        string BodyEn,
        string? BodyEs,
        string? TemplateKey,
        string? Vegetable,
        DateTime StartsAt,
        DateTime ExpiresAt,
        int? RepeatDays,
        string Audience,
        bool IncludeGuests,
        List<Guid> Include,
        List<Guid> Exclude);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var list = await db.Notifications
            .AsNoTracking()
            .Include(n => n.Targets)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        Response.Headers.CacheControl = "no-store";
        return Ok(await DescribeAsync(list));
    }

    [HttpGet("templates")]
    public IActionResult Templates() => Ok(new
    {
        templates = NotificationTemplates.All.Select(t => new
        {
            key = t.Key,
            en = t.En,
            es = t.Es,
            needsVegetable = t.NeedsVegetable
        }),
        vegetables = NotificationTemplates.Vegetables.Select(v => new { key = v.Key, en = v.En }),
        slot = NotificationTemplates.Slot
    });

    [HttpGet("people")]
    public async Task<IActionResult> People()
    {
        var ids = await ParticipantIds.EnsureAsync(db);
        var people = await (await StudyTracking.PeopleAsync(db))
            .Where(u => u.DeletedAt == null)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new { u.Id, u.AgeRange, u.CreatedAt })
            .ToListAsync();

        Response.Headers.CacheControl = "no-store";
        return Ok(people
            .Where(p => ids.ContainsKey(p.Id))
            .Select(p => new { researchId = ids[p.Id], ageRange = p.AgeRange, joinedAt = p.CreatedAt }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NotificationRequest req)
    {
        var (parsed, error) = await ParseAsync(req, creating: true, currentStart: null);
        if (parsed is null) return BadRequest(new { error });

        var now = DateTime.UtcNow;
        var n = new Notification { CreatedAt = now, CreatedBy = AdminId() };
        Apply(n, parsed);
        db.Notifications.Add(n);
        await db.SaveChangesAsync();

        await NotificationActivity.RecordAdminAsync(db, logger, NotificationActivity.Created, n, Summary(n));
        return Ok((await DescribeAsync([n]))[0]);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Edit(int id, [FromBody] NotificationRequest req)
    {
        var n = await db.Notifications.Include(x => x.Targets).FirstOrDefaultAsync(x => x.Id == id);
        if (n is null) return NotFound(new { error = "That notification no longer exists. Refresh the page." });
        if (n.CancelledAt is not null)
            return Conflict(new { error = "This notification was stopped and can't be edited. Create a new one instead." });

        var (parsed, error) = await ParseAsync(req, creating: false, currentStart: n.StartsAt);
        if (parsed is null) return BadRequest(new { error });

        Apply(n, parsed);
        n.UpdatedAt = DateTime.UtcNow;
        n.UpdatedBy = AdminId();
        await db.SaveChangesAsync();

        await NotificationActivity.RecordAdminAsync(db, logger, NotificationActivity.Edited, n, Summary(n));
        return Ok((await DescribeAsync([n]))[0]);
    }

    [HttpPost("{id:int}/stop")]
    public async Task<IActionResult> Stop(int id)
    {
        var n = await db.Notifications.Include(x => x.Targets).FirstOrDefaultAsync(x => x.Id == id);
        if (n is null) return NotFound(new { error = "That notification no longer exists. Refresh the page." });
        if (n.CancelledAt is not null) return Ok((await DescribeAsync([n]))[0]);

        var now = DateTime.UtcNow;
        n.CancelledAt = now;
        n.UpdatedAt = now;
        n.UpdatedBy = AdminId();
        await db.SaveChangesAsync();

        await NotificationActivity.RecordAdminAsync(
            db, logger, NotificationActivity.Stopped, n, $"Notification {n.Id} stopped {Eastern(now)}");
        return Ok((await DescribeAsync([n]))[0]);
    }

    private async Task<(Parsed? Value, string? Error)> ParseAsync(
        NotificationRequest req, bool creating, DateTime? currentStart)
    {
        var body = (req.BodyEn ?? "").Trim();
        if (body.Length == 0) return (null, "Write the message.");
        if (body.Length > MaxBody) return (null, $"Keep the message to {MaxBody} characters or fewer.");
        if (body.Contains(NotificationTemplates.Slot)) return (null, "Pick a vegetable for this message.");

        var now = DateTime.UtcNow;
        DateTime starts;
        if (req.StartNow == true) starts = now;
        else if (req.StartsAt is null) return (null, "Choose when it starts.");
        else starts = req.StartsAt.Value.UtcDateTime;

        // An unchanged start of a message that already started is kept, so
        // its rounds and counts stay as they are.
        var keepsStart = currentStart is DateTime current
            && current <= now
            && Math.Abs((starts - current).TotalSeconds) < 1;
        if (keepsStart) starts = currentStart!.Value;
        else if (starts < now) starts = now;

        if (req.ExpiresAt is null) return (null, "Choose when it ends.");
        var expires = req.ExpiresAt.Value.UtcDateTime;
        if (expires <= starts) return (null, "The end must be after the start.");
        if (creating && expires <= now) return (null, "The end time has already passed.");

        if (req.RepeatDays is int days && (days < 1 || days > MaxRepeatDays))
            return (null, $"Repeat every 1 to {MaxRepeatDays} days, or not at all.");

        var audience = req.Audience ?? Notification.AudienceAll;
        if (audience is not (Notification.AudienceAll or Notification.AudienceSelected))
            return (null, "Choose who gets this message.");

        var (include, unknownIn) = await ResolveAsync(audience == Notification.AudienceSelected ? req.IncludeIds : null);
        var (exclude, unknownOut) = await ResolveAsync(audience == Notification.AudienceAll ? req.ExcludeIds : null);
        var unknown = unknownIn.Concat(unknownOut).ToList();
        if (unknown.Count > 0)
            return (null, $"No current account has these research IDs: {string.Join(", ", unknown)}.");
        if (audience == Notification.AudienceSelected && include.Count == 0)
            return (null, "Pick at least one research ID, or send to everyone.");

        var template = NotificationTemplates.Find(req.TemplateKey);
        var vegetable = template is { NeedsVegetable: true }
            ? NotificationTemplates.FindVegetable(req.Vegetable)
            : null;

        return (new Parsed(
            body,
            NotificationTemplates.SpanishFor(template?.Key, vegetable?.Key, body),
            template?.Key,
            vegetable?.Key,
            starts,
            expires,
            req.RepeatDays,
            audience,
            req.IncludeGuests == true,
            include,
            exclude), null);
    }

    // Research IDs to current, non-admin accounts. Returns the IDs not found.
    private async Task<(List<Guid> Ids, List<string> Unknown)> ResolveAsync(List<string>? researchIds)
    {
        var wanted = (researchIds ?? [])
            .Select(i => i.Trim().ToUpperInvariant())
            .Where(i => i.Length > 0)
            .Distinct()
            .ToList();
        if (wanted.Count == 0) return ([], []);

        var people = (await StudyTracking.PeopleAsync(db)).Where(u => u.DeletedAt == null);
        var found = await db.ResearchParticipants
            .AsNoTracking()
            .Where(p => wanted.Contains(p.ParticipantId))
            .Join(people, p => p.UserId, u => u.Id, (p, u) => new { p.ParticipantId, p.UserId })
            .ToListAsync();

        var unknown = wanted.Except(found.Select(f => f.ParticipantId)).ToList();
        return (found.Select(f => f.UserId).ToList(), unknown);
    }

    // Updates targets in place so a kept target is never removed and re-added.
    private static void Apply(Notification n, Parsed p)
    {
        n.BodyEn = p.BodyEn;
        n.BodyEs = p.BodyEs;
        n.TemplateKey = p.TemplateKey;
        n.Vegetable = p.Vegetable;
        n.StartsAt = p.StartsAt;
        n.ExpiresAt = p.ExpiresAt;
        n.RepeatDays = p.RepeatDays;
        n.Audience = p.Audience;
        n.IncludeGuests = p.IncludeGuests;

        var wanted = p.Include.Select(id => (id, NotificationTarget.Include))
            .Concat(p.Exclude.Select(id => (id, NotificationTarget.Exclude)))
            .ToDictionary(x => x.id, x => x.Item2);

        n.Targets.RemoveAll(t => !wanted.ContainsKey(t.UserId));
        foreach (var t in n.Targets) t.Mode = wanted[t.UserId];
        foreach (var (userId, mode) in wanted)
            if (n.Targets.All(t => t.UserId != userId))
                n.Targets.Add(new NotificationTarget { NotificationId = n.Id, UserId = userId, Mode = mode });
    }

    private async Task<List<object>> DescribeAsync(List<Notification> list)
    {
        var now = DateTime.UtcNow;
        var ids = await ParticipantIds.EnsureAsync(db);
        var noteIds = list.Select(n => n.Id).ToList();

        var receipts = await db.NotificationReceipts
            .AsNoTracking()
            .Where(r => noteIds.Contains(r.NotificationId))
            .Select(r => new { r.NotificationId, r.UserId, r.OpenedAt, r.ClickedAt, r.DismissedAt })
            .ToListAsync();
        var byNote = receipts.ToLookup(r => r.NotificationId);

        string IdOf(Guid userId) => ids.TryGetValue(userId, out var rid) ? rid : "";

        return list.Select(n =>
        {
            var r = byNote[n.Id].ToList();
            return (object)new
            {
                id = n.Id,
                bodyEn = n.BodyEn,
                hasSpanish = n.BodyEs is not null,
                templateKey = n.TemplateKey,
                vegetable = n.Vegetable,
                audience = n.Audience,
                includeGuests = n.IncludeGuests,
                includeIds = n.Targets.Where(t => t.Mode == NotificationTarget.Include).Select(t => IdOf(t.UserId)).ToList(),
                excludeIds = n.Targets.Where(t => t.Mode == NotificationTarget.Exclude).Select(t => IdOf(t.UserId)).ToList(),
                startsAt = n.StartsAt,
                expiresAt = n.ExpiresAt,
                repeatDays = n.RepeatDays,
                status = NotificationRules.StatusOf(n, now),
                round = NotificationRules.RoundAt(n, now),
                createdAt = n.CreatedAt,
                updatedAt = n.UpdatedAt,
                stoppedAt = n.CancelledAt,
                counts = new
                {
                    shown = r.Select(x => x.UserId).Distinct().Count(),
                    opened = r.Where(x => x.OpenedAt != null).Select(x => x.UserId).Distinct().Count(),
                    link = r.Where(x => x.ClickedAt != null).Select(x => x.UserId).Distinct().Count(),
                    dismissed = r.Where(x => x.DismissedAt != null).Select(x => x.UserId).Distinct().Count()
                }
            };
        }).ToList();
    }

    private static string Summary(Notification n)
    {
        var who = n.Audience == Notification.AudienceSelected ? "selected accounts" : "all accounts";
        if (n.IncludeGuests) who += " and guests";
        var repeat = n.RepeatDays is int d ? $", every {d} days" : "";
        return $"Notification {n.Id}: {Eastern(n.StartsAt)} to {Eastern(n.ExpiresAt)}{repeat}, to {who}";
    }

    private static string Eastern(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), AllDataSource.Local.Zone)
            .ToString("MMM d, yyyy h:mm tt", System.Globalization.CultureInfo.InvariantCulture);

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}