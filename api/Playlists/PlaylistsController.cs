using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;
using VeggieBook.Api.Notifications;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Playlists;

// Playlists in the main site, inside Notifications.
//
//   GET    /api/playlists?lang=en|es                  kept playlists and own playlists
//   GET    /api/playlists/{id}?lang=                  one admin playlist with its items
//   POST   /api/playlists/{id}/keep                   body { notificationId }
//   POST   /api/playlists/{id}/skip                   body { notificationId }
//   DELETE /api/playlists/{id}/keep                   take a kept playlist out
//   POST   /api/playlists/{id}/opened/{kind}/{itemId} a tip or recipe opened from it
//
// An admin playlist opens only when a live notification that reaches this
// account links to it, or when the account kept it. Every step writes an
// activity line (PlaylistActivity). Own playlists: OwnPlaylistsController.

public record PlaylistDecisionRequest(int? NotificationId);

[ApiController]
[Route("api/playlists")]
[Authorize]
public class PlaylistsController(
    AccountsContext db,
    VeggieBookContext content,
    ILogger<PlaylistsController> logger) : ControllerBase
{
    private Guid CurrentUserId =>
        AuthSetup.UserId(User) ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet]
    public async Task<IActionResult> Mine([FromQuery] string? lang)
    {
        var uid = CurrentUserId;
        var es = Lang.IsSpanish(lang);

        var kept = await (
                from c in db.PlaylistChoices
                where c.UserId == uid && c.Kept
                join p in db.Playlists on c.PlaylistId equals p.Id
                orderby c.DecidedAt descending
                select new
                {
                    p.Id,
                    p.NameEn,
                    p.NameEs,
                    c.DecidedAt,
                    Tips = p.Items.Count(i => i.Kind == PlaylistKinds.Tip),
                    Recipes = p.Items.Count(i => i.Kind == PlaylistKinds.Recipe),
                    Cover = p.Items
                        .Where(i => i.Kind == PlaylistKinds.Recipe)
                        .OrderBy(i => i.Position)
                        .Select(i => (int?)i.ItemId)
                        .FirstOrDefault()
                })
            .AsNoTracking()
            .ToListAsync();

        var own = await db.UserPlaylists
            .AsNoTracking()
            .Where(u => u.UserId == uid)
            .OrderByDescending(u => u.UpdatedAt ?? u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.CreatedAt,
                u.UpdatedAt,
                Recipes = u.Items.Count,
                Cover = u.Items.OrderBy(i => i.Position).Select(i => (int?)i.RecipeId).FirstOrDefault()
            })
            .ToListAsync();

        var coverIds = kept.Select(k => k.Cover).Concat(own.Select(o => o.Cover)).OfType<int>().Distinct().ToArray();
        var covers = (await content.Recipes
                .AsNoTracking()
                .Where(r => coverIds.Contains(r.Id))
                .Select(r => new { r.Id, Photos = r.Photos.OrderBy(p => p.Position).Select(p => p.ImagePath).ToList() })
                .ToListAsync())
            .ToDictionary(r => r.Id, r => RecipePhotos.Finished(r.Photos));

        string? CoverOf(int? id) => id is int i ? covers.GetValueOrDefault(i) : null;

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            kept = kept.Select(k => new
            {
                id = k.Id,
                name = es && !string.IsNullOrEmpty(k.NameEs) ? k.NameEs : k.NameEn,
                tips = k.Tips,
                recipes = k.Recipes,
                cover = CoverOf(k.Cover),
                keptAt = k.DecidedAt
            }),
            own = own.Select(o => new
            {
                id = o.Id,
                name = o.Name,
                recipes = o.Recipes,
                cover = CoverOf(o.Cover),
                updatedAt = o.UpdatedAt ?? o.CreatedAt
            })
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, [FromQuery] string? lang)
    {
        var uid = CurrentUserId;

        var p = await db.Playlists.AsNoTracking().Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();

        var choice = await db.PlaylistChoices.AsNoTracking()
            .FirstOrDefaultAsync(c => c.PlaylistId == id && c.UserId == uid);
        if (choice?.Kept != true && !await OfferedAsync(uid, id)) return NotFound();

        var items = await PlaylistContent.LoadAsync(content, PlaylistHelpers.RefsOf(p), lang);
        await PlaylistActivity.RecordAsync(
            db, logger, uid, PlaylistActivity.Opened, id, PlaylistActivity.SourceAdmin, items.Count);

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            id = p.Id,
            name = Lang.IsSpanish(lang) && !string.IsNullOrEmpty(p.NameEs) ? p.NameEs : p.NameEn,
            choice = choice is null ? null : choice.Kept ? "kept" : "skipped",
            items
        });
    }

    [HttpPost("{id:int}/keep")]
    public Task<IActionResult> Keep(int id, [FromBody] PlaylistDecisionRequest? req) => DecideAsync(id, true, req);

    [HttpPost("{id:int}/skip")]
    public Task<IActionResult> Skip(int id, [FromBody] PlaylistDecisionRequest? req) => DecideAsync(id, false, req);

    [HttpDelete("{id:int}/keep")]
    public Task<IActionResult> Remove(int id) => DecideAsync(id, false, null);

    [HttpPost("{id:int}/opened/{kind}/{itemId:int}")]
    public async Task<IActionResult> ItemOpened(int id, string kind, int itemId)
    {
        if (!PlaylistKinds.IsKnown(kind)) return NotFound();
        var uid = CurrentUserId;

        var inList = await db.PlaylistItems.AnyAsync(i => i.PlaylistId == id && i.Kind == kind && i.ItemId == itemId);
        if (!inList) return NoContent();

        await PlaylistActivity.RecordAsync(
            db, logger, uid, PlaylistActivity.ItemOpened, id,
            PlaylistActivity.ItemDetail(PlaylistActivity.SourceAdmin, kind, itemId));
        return NoContent();
    }

    // Keep, skip, or take out. Only a change writes a line: kept, skipped, or
    // removed when a kept playlist is let go.
    private async Task<IActionResult> DecideAsync(int id, bool keep, PlaylistDecisionRequest? req)
    {
        var uid = CurrentUserId;

        var p = await db.Playlists.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new { x.Id, Count = x.Items.Count })
            .FirstOrDefaultAsync();
        if (p is null) return NotFound();

        var choice = await db.PlaylistChoices.FirstOrDefaultAsync(c => c.PlaylistId == id && c.UserId == uid);
        if (choice?.Kept != true && !await OfferedAsync(uid, id)) return NotFound();
        if (choice is not null && choice.Kept == keep) return NoContent();

        var wasKept = choice?.Kept == true;
        if (choice is null)
        {
            choice = new PlaylistChoice { PlaylistId = id, UserId = uid };
            db.PlaylistChoices.Add(choice);
        }
        choice.Kept = keep;
        choice.DecidedAt = DateTime.UtcNow;
        if (req?.NotificationId is int nid
            && await db.Notifications.AnyAsync(n => n.Id == nid && n.PlaylistId == id))
            choice.NotificationId = nid;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Two tabs decided at once; the other one was stored.
            return NoContent();
        }

        var kind = keep ? PlaylistActivity.Kept : wasKept ? PlaylistActivity.Removed : PlaylistActivity.Skipped;
        await PlaylistActivity.RecordAsync(db, logger, uid, kind, id, PlaylistActivity.SourceAdmin, p.Count);
        return NoContent();
    }

    // A live notification that reaches this account links to the playlist.
    private async Task<bool> OfferedAsync(Guid uid, int playlistId)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == uid);
        if (user is null) return false;

        var now = DateTime.UtcNow;
        var list = await db.Notifications
            .AsNoTracking()
            .Where(n => n.PlaylistId == playlistId && n.CancelledAt == null && n.StartsAt <= now && n.ExpiresAt > now)
            .Include(n => n.Targets.Where(t => t.UserId == uid))
            .ToListAsync();

        return list.Any(n => NotificationRules.Reaches(n, uid, GuestAccounts.IsGuest(user)));
    }
}