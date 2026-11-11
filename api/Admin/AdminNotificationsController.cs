using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Notifications;
using VeggieBook.Api.Playlists;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Admin;

// The Notifications page, Messages section.
//
//   GET  /api/admin/notifications            every notification, newest first,
//                                            with its status and counts
//   GET  /api/admin/notifications/templates  the templates and vegetables
//   GET  /api/admin/notifications/people     research IDs that can be picked
//   POST /api/admin/notifications            create
//   PUT  /api/admin/notifications/{id}       edit title, text, playlist,
//                                            dates, repeat, audience
//   PUT  /api/admin/notifications/{id}/title rename, allowed in any status
//   POST /api/admin/notifications/{id}/stop  stop now; a stopped message
//                                            can't be edited, only renamed
//
// The title is an admin-only label; the app never shows it. Activity names
// the message by its title, so the log details here hold only the facts.
//
// Edit and rename take the version the page loaded. If another admin saved
// since, the change is refused with changed: true so the page can reload.
// Without a version (older pages) no check is made.
//
// Playlist: "none", "made" (a saved playlist by id) or "auto" (a vegetable
// and a meal; AutoPlaylists builds or refreshes it). Timing and audience are
// the notification's own.
//
// Start times: StartNow uses the server's clock at the moment of saving. A
// requested start that has already passed also starts now, except the
// unchanged start of a message that has already started, which is kept.
//
// Admins only. Accounts are chosen by research ID; no email or username of a
// participant is read or sent. Counts are people (distinct accounts), guests
// included. Every create, edit, rename and stop is written to the activity
// log with the admin who did it.

public record NotificationRequest(
    string? Title,
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
    bool? StartNow,
    string? PlaylistMode,
    int? PlaylistId,
    string? PlaylistVegetable,
    string? PlaylistMeal,
    uint? Version);

public record NotificationTitleRequest(string? Title, uint? Version);

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminNotificationsController(
    AccountsContext db,
    VeggieBookContext content,
    UserManager<AppUser> users,
    ILogger<AdminNotificationsController> logger) : ControllerBase
{
    private const int MaxBody = 500;
    private const int MaxTitle = 80;
    private const int MaxRepeatDays = 365;

    private const string Changed =
        "Another admin changed this notification. Refresh to see the latest.";

    private sealed record Parsed(
        string? Title,
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

        var (playlistId, playlistName, playlistError) = await ResolvePlaylistAsync(req, current: null);
        if (playlistError is not null) return BadRequest(new { error = playlistError });

        var now = DateTime.UtcNow;
        var n = new Notification { CreatedAt = now, CreatedBy = AdminId() };
        Apply(n, parsed);
        n.PlaylistId = playlistId;
        db.Notifications.Add(n);
        await db.SaveChangesAsync();

        await NotificationActivity.RecordAdminAsync(
            db, logger, NotificationActivity.Created, n, Summary(n, playlistName), AdminId());
        return Ok((await DescribeAsync([n]))[0]);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Edit(int id, [FromBody] NotificationRequest req)
    {
        var n = await db.Notifications.Include(x => x.Targets).FirstOrDefaultAsync(x => x.Id == id);
        if (n is null) return NotFound(new { error = "That notification no longer exists. Refresh the page." });
        if (IsStale(n, req.Version)) return Conflict(new { error = Changed, changed = true });
        if (n.CancelledAt is not null)
            return Conflict(new { error = "This notification was stopped and can't be edited. Create a new one instead." });

        var (parsed, error) = await ParseAsync(req, creating: false, currentStart: n.StartsAt);
        if (parsed is null) return BadRequest(new { error });

        var (playlistId, playlistName, playlistError) = await ResolvePlaylistAsync(req, current: n.PlaylistId);
        if (playlistError is not null) return BadRequest(new { error = playlistError });

        Apply(n, parsed);
        n.PlaylistId = playlistId;
        n.UpdatedAt = DateTime.UtcNow;
        n.UpdatedBy = AdminId();
        if (!await SaveAsync()) return Conflict(new { error = Changed, changed = true });

        await NotificationActivity.RecordAdminAsync(
            db, logger, NotificationActivity.Edited, n, Summary(n, playlistName), AdminId());
        return Ok((await DescribeAsync([n]))[0]);
    }

    [HttpPut("{id:int}/title")]
    public async Task<IActionResult> Rename(int id, [FromBody] NotificationTitleRequest req)
    {
        var n = await db.Notifications.Include(x => x.Targets).FirstOrDefaultAsync(x => x.Id == id);
        if (n is null) return NotFound(new { error = "That notification no longer exists. Refresh the page." });
        if (IsStale(n, req.Version)) return Conflict(new { error = Changed, changed = true });

        var (title, error) = ParseTitle(req.Title);
        if (error is not null) return BadRequest(new { error });
        if (title == n.Title) return Ok((await DescribeAsync([n]))[0]);

        var before = n.Title;
        n.Title = title;
        n.UpdatedAt = DateTime.UtcNow;
        n.UpdatedBy = AdminId();
        if (!await SaveAsync()) return Conflict(new { error = Changed, changed = true });

        await NotificationActivity.RecordAdminAsync(
            db, logger, NotificationActivity.Edited, n, $"Renamed from {Quoted(before)} to {Quoted(title)}", AdminId());
        return Ok((await DescribeAsync([n]))[0]);
    }

    // Stopping twice is harmless, so no version is needed.
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
        if (!await SaveAsync()) return Conflict(new { error = Changed, changed = true });

        await NotificationActivity.RecordAdminAsync(
            db, logger, NotificationActivity.Stopped, n,
            $"Taken down {Eastern(now)}, was set to end {Eastern(n.ExpiresAt)}", AdminId());
        return Ok((await DescribeAsync([n]))[0]);
    }

    // True when the page sent a version and the row has changed since.
    private static bool IsStale(Notification n, uint? version) =>
        version is uint v && v != n.Version;

    // False when another save landed between reading and saving.
    private async Task<bool> SaveAsync()
    {
        try
        {
            await db.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }
    }

    // The playlist this notification opens. A saved playlist that is now
    // archived can stay on the message it was already on.
    private async Task<(int? Id, string? Name, string? Error)> ResolvePlaylistAsync(
        NotificationRequest req, int? current)
    {
        switch (req.PlaylistMode ?? "none")
        {
            case "none":
                return (null, null, null);

            case "made":
            {
                if (req.PlaylistId is not int id) return (null, null, "Pick a playlist.");
                var p = await db.Playlists.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
                if (p is null) return (null, null, "That playlist no longer exists. Refresh the page.");
                if (p.ArchivedAt is not null && id != current)
                    return (null, null, "That playlist is archived. Restore it first.");
                return (p.Id, p.NameEn, null);
            }

            case "auto":
            {
                var (p, error) = await AutoPlaylists.EnsureAsync(
                    db, content, logger, req.PlaylistVegetable, req.PlaylistMeal, AdminId());
                return p is null ? (null, null, error) : (p.Id, p.NameEn, null);
            }

            default:
                return (null, null, "Choose what the notification opens.");
        }
    }

    // Empty means no title.
    private static (string? Title, string? Error) ParseTitle(string? raw)
    {
        var title = (raw ?? "").Trim();
        if (title.Length > MaxTitle) return (null, $"Keep the title to {MaxTitle} characters or fewer.");
        return (title.Length == 0 ? null : title, null);
    }

    private async Task<(Parsed? Value, string? Error)> ParseAsync(
        NotificationRequest req, bool creating, DateTime? currentStart)
    {
        var (title, titleError) = ParseTitle(req.Title);
        if (titleError is not null) return (null, titleError);

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
            title,
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
        n.Title = p.Title;
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
        var names = await AdminNames.LoadAsync(db, list.SelectMany(n => new[] { n.CreatedBy, n.UpdatedBy }));

        var receipts = await db.NotificationReceipts
            .AsNoTracking()
            .Where(r => noteIds.Contains(r.NotificationId))
            .Select(r => new { r.NotificationId, r.UserId, r.OpenedAt, r.ClickedAt, r.DismissedAt })
            .ToListAsync();
        var byNote = receipts.ToLookup(r => r.NotificationId);

        var playlistIds = list.Where(n => n.PlaylistId != null).Select(n => n.PlaylistId!.Value).Distinct().ToList();
        var playlists = await db.Playlists
            .AsNoTracking()
            .Where(p => playlistIds.Contains(p.Id))
            .Select(p => new
            {
                p.Id,
                p.NameEn,
                p.AutoVegetable,
                p.AutoMeal,
                Archived = p.ArchivedAt != null,
                Tips = p.Items.Count(i => i.Kind == PlaylistKinds.Tip),
                Recipes = p.Items.Count(i => i.Kind == PlaylistKinds.Recipe)
            })
            .ToDictionaryAsync(p => p.Id);

        string IdOf(Guid userId) => ids.TryGetValue(userId, out var rid) ? rid : "";

        object? PlaylistOf(Notification n) =>
            n.PlaylistId is int pid && playlists.TryGetValue(pid, out var p)
                ? new
                {
                    id = p.Id,
                    name = p.NameEn,
                    auto = p.AutoMeal != null,
                    vegetable = p.AutoVegetable,
                    meal = p.AutoMeal,
                    archived = p.Archived,
                    tips = p.Tips,
                    recipes = p.Recipes
                }
                : null;

        return list.Select(n =>
        {
            var r = byNote[n.Id].ToList();
            return (object)new
            {
                id = n.Id,
                version = n.Version,
                title = n.Title,
                bodyEn = n.BodyEn,
                hasSpanish = n.BodyEs is not null,
                templateKey = n.TemplateKey,
                vegetable = n.Vegetable,
                playlist = PlaylistOf(n),
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
                createdBy = AdminNames.Of(names, n.CreatedBy),
                updatedAt = n.UpdatedAt,
                updatedBy = AdminNames.Of(names, n.UpdatedBy),
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

    private static string Quoted(string? title) => title is null ? "no title" : $"\"{title}\"";

    // "Nov 8, 2026 10:23 AM to Nov 8, 2026 11:59 PM, every 7 days, to all
    // accounts and guests, opens "Snack ideas with zucchini""
    private static string Summary(Notification n, string? playlistName)
    {
        var who = n.Audience == Notification.AudienceSelected ? "selected accounts" : "all accounts";
        if (n.IncludeGuests) who += " and guests";
        var repeat = n.RepeatDays is int d ? $", every {d} days" : "";
        var opens = playlistName is null ? "" : $", opens \"{playlistName}\"";
        return $"{Eastern(n.StartsAt)} to {Eastern(n.ExpiresAt)}{repeat}, to {who}{opens}";
    }

    private static string Eastern(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), AllDataSource.Local.Zone)
            .ToString("MMM d, yyyy h:mm tt", System.Globalization.CultureInfo.InvariantCulture);

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}