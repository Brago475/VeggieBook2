using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Notifications;

// Notifications in the main site.
//
//   GET  /api/notifications?lang=en|es   live notifications for this visitor,
//                                       newest first: text, round, whether
//                                       the pop-up has shown, whether read,
//                                       and the playlist it opens, if any,
//                                       with this account's Keep or Skip
//   POST /api/notifications/{id}/{step}  step: seen (the pop-up showed), open,
//                                       link, or close. Body: { "round": n }.
//                                       Only the first of each step per round
//                                       counts.
//
// Visitors and admins get an empty list. Read means opened or closed.
// Research lines follow NotificationActivity. Playlists: api/Playlists.

public record NotificationStepRequest(int? Round);

[ApiController]
[Route("api/notifications")]
public class NotificationsController(
    AccountsContext db,
    UserManager<AppUser> users,
    ILogger<NotificationsController> logger) : ControllerBase
{
    private sealed record Viewer(Guid Id, bool IsGuest);

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Mine([FromQuery] string? lang)
    {
        Response.Headers.CacheControl = "no-store";

        var viewer = await ViewerAsync();
        if (viewer is null) return Ok(new { unread = 0, items = Array.Empty<object>() });

        var now = DateTime.UtcNow;
        var live = await LiveForAsync(viewer, now);
        var ids = live.Select(n => n.Id).ToList();

        var receipts = await db.NotificationReceipts
            .AsNoTracking()
            .Where(r => r.UserId == viewer.Id && ids.Contains(r.NotificationId))
            .ToListAsync();

        var language = lang == "es" ? "es" : "en";

        var playlistIds = live.Where(n => n.PlaylistId != null).Select(n => n.PlaylistId!.Value).Distinct().ToList();
        var playlists = await db.Playlists
            .AsNoTracking()
            .Where(p => playlistIds.Contains(p.Id))
            .Select(p => new
            {
                p.Id,
                p.NameEn,
                p.NameEs,
                Tips = p.Items.Count(i => i.Kind == PlaylistKinds.Tip),
                Recipes = p.Items.Count(i => i.Kind == PlaylistKinds.Recipe)
            })
            .ToDictionaryAsync(p => p.Id);
        var choices = await db.PlaylistChoices
            .AsNoTracking()
            .Where(c => c.UserId == viewer.Id && playlistIds.Contains(c.PlaylistId))
            .ToDictionaryAsync(c => c.PlaylistId, c => c.Kept);

        object? PlaylistOf(Notification n)
        {
            if (n.PlaylistId is not int pid || !playlists.TryGetValue(pid, out var p)) return null;
            return new
            {
                id = p.Id,
                name = language == "es" && !string.IsNullOrEmpty(p.NameEs) ? p.NameEs : p.NameEn,
                tips = p.Tips,
                recipes = p.Recipes,
                choice = choices.TryGetValue(pid, out var kept) ? (kept ? "kept" : "skipped") : null
            };
        }

        var items = live
            .Select(n =>
            {
                var round = NotificationRules.RoundAt(n, now);
                var receipt = receipts.FirstOrDefault(r => r.NotificationId == n.Id && r.Round == round);
                return new
                {
                    id = n.Id,
                    round,
                    text = NotificationRules.TextFor(n, language),
                    sentAt = NotificationRules.RoundStart(n, round),
                    expiresAt = n.ExpiresAt,
                    shown = receipt is not null,
                    read = receipt?.OpenedAt is not null || receipt?.DismissedAt is not null,
                    playlist = PlaylistOf(n)
                };
            })
            .OrderByDescending(i => i.sentAt)
            .ToList();

        return Ok(new { unread = items.Count(i => !i.read), items });
    }

    [HttpPost("{id:int}/{step}")]
    [Authorize]
    public async Task<IActionResult> Step(int id, string step, [FromBody] NotificationStepRequest req)
    {
        var kind = step switch
        {
            "seen" => NotificationActivity.Shown,
            "open" => NotificationActivity.Opened,
            "link" => NotificationActivity.Link,
            "close" => NotificationActivity.Dismissed,
            _ => null
        };
        if (kind is null) return NotFound();

        var viewer = await ViewerAsync();
        if (viewer is null) return NoContent();

        var now = DateTime.UtcNow;
        var n = (await LiveForAsync(viewer, now, id)).FirstOrDefault();
        if (n is null) return NoContent();

        // A tab left open from an earlier round records nothing.
        var round = NotificationRules.RoundAt(n, now);
        if (req.Round != round) return NoContent();

        var receipt = await db.NotificationReceipts.FirstOrDefaultAsync(r =>
            r.NotificationId == id && r.UserId == viewer.Id && r.Round == round);

        var isNew = receipt is null;
        if (receipt is null)
        {
            receipt = new NotificationReceipt
            {
                NotificationId = id,
                UserId = viewer.Id,
                Round = round,
                ShownAt = now
            };
            db.NotificationReceipts.Add(receipt);
        }

        var changed = isNew;
        switch (kind)
        {
            case NotificationActivity.Opened when receipt.OpenedAt is null:
                receipt.OpenedAt = now;
                changed = true;
                break;
            case NotificationActivity.Link when receipt.ClickedAt is null:
                receipt.ClickedAt = now;
                changed = true;
                break;
            case NotificationActivity.Dismissed when receipt.DismissedAt is null:
                receipt.DismissedAt = now;
                changed = true;
                break;
        }
        if (!changed) return NoContent();

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Two tabs sent the same step at once; the other one was stored.
            return NoContent();
        }

        // Any step implies the message was shown first.
        if (isNew && kind != NotificationActivity.Shown)
            await NotificationActivity.RecordAsync(db, logger, viewer.Id, NotificationActivity.Shown, n, round);
        if (isNew || kind != NotificationActivity.Shown)
            await NotificationActivity.RecordAsync(db, logger, viewer.Id, kind, n, round);

        return NoContent();
    }

    // Signed-in accounts and guests. Admins never get notifications.
    private async Task<Viewer?> ViewerAsync()
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return null;
        if (await StudyTracking.IsAdminAsync(db, user.Id)) return null;
        return new Viewer(user.Id, GuestAccounts.IsGuest(user));
    }

    private async Task<List<Notification>> LiveForAsync(Viewer viewer, DateTime now, int? onlyId = null)
    {
        var query = db.Notifications
            .AsNoTracking()
            .Where(n => n.CancelledAt == null && n.StartsAt <= now && n.ExpiresAt > now);
        if (onlyId is int one) query = query.Where(n => n.Id == one);

        var list = await query
            .Include(n => n.Targets.Where(t => t.UserId == viewer.Id))
            .ToListAsync();

        return list.Where(n => NotificationRules.Reaches(n, viewer.Id, viewer.IsGuest)).ToList();
    }
}