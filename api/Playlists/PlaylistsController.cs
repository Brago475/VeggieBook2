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
//   POST   /api/playlists/{id}/opened/{kind}/{itemId} accepted, not recorded
//
// An admin playlist opens only when a live notification that reaches this
// account links to it, or when the account kept it. Only decisions (kept,
// skipped, removed) write activity lines; viewing does not.
// Own playlists: OwnPlaylistsController.

public record PlaylistDecisionRequest(int? NotificationId);

[ApiController]
[Route("api/playlists")]
[Authorize]
public class PlaylistsController(
    AccountsContext db,
    VeggieBookContext content,
    ILogger<PlaylistsController> logger) : ControllerBase
{
    // Recipe photos sent per playlist for the card's slideshow.
    private const int PhotoLimit = 5;

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
                    RecipeIds = p.Items
                        .Where(i => i.Kind == PlaylistKinds.Recipe)
                        .OrderBy(i => i.Position)
                        .Select(i => i.ItemId)
                        .Take(PhotoLimit)
                        .ToList()
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
                RecipeIds = u.Items
                    .OrderBy(i => i.Position)
                    .Select(i => i.RecipeId)
                    .Take(PhotoLimit)
                    .ToList()
            })
            .ToListAsync();

        var recipeIds = kept.SelectMany(k => k.RecipeIds)
            .Concat(own.SelectMany(o => o.RecipeIds))
            .Distinct()
            .ToArray();
        var finished = (await content.Recipes
                .AsNoTracking()
                .Where(r => recipeIds.Contains(r.Id))
                .Select(r => new { r.Id, Photos = r.Photos.OrderBy(p => p.Position).Select(p => p.ImagePath).ToList() })
                .ToListAsync())
            .ToDictionary(r => r.Id, r => RecipePhotos.Finished(r.Photos));

        // One finished photo per recipe, in playlist order, skipping recipes without one.
        List<string> PhotosOf(IEnumerable<int> ids) =>
            ids.Select(i => finished.GetValueOrDefault(i)).OfType<string>().Distinct().ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            kept = kept.Select(k =>
            {
                var photos = PhotosOf(k.RecipeIds);
                return new
                {
                    id = k.Id,
                    name = es && !string.IsNullOrEmpty(k.NameEs) ? k.NameEs : k.NameEn,
                    tips = k.Tips,
                    recipes = k.Recipes,
                    cover = photos.FirstOrDefault(),
                    photos,
                    keptAt = k.DecidedAt
                };
            }),
            own = own.Select(o =>
            {
                var photos = PhotosOf(o.RecipeIds);
                return new
                {
                    id = o.Id,
                    name = o.Name,
                    recipes = o.Recipes,
                    cover = photos.FirstOrDefault(),
                    photos,
                    updatedAt = o.UpdatedAt ?? o.CreatedAt
                };
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

    // Still called by the main site when a tip or recipe opens; views are not recorded.
    [HttpPost("{id:int}/opened/{kind}/{itemId:int}")]
    public IActionResult ItemOpened(int id, string kind, int itemId) => NoContent();

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