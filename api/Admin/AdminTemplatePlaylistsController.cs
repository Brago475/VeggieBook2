using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Notifications;
using VeggieBook.Api.Playlists;

namespace VeggieBook.Api.Admin;

// Default playlists for notification templates. Picking a template in the
// notification editor starts with its default playlist; the admin can still
// change it.
//
//   GET    /api/admin/template-playlists     every link, with its label and
//                                            whether the playlist is archived
//   PUT    /api/admin/template-playlists     set one, body { templateKey,
//                                            vegetable, playlistId }
//   DELETE /api/admin/template-playlists     clear one, ?templateKey=&vegetable=
//
// A template with a vegetable slot can have one default for any vegetable
// (vegetable "") and one per vegetable; a vegetable's own default wins.
// Templates without a slot always use "". Admins only. Changes are written
// to the activity log as playlist edits.

public record TemplatePlaylistRequest(string? TemplateKey, string? Vegetable, int PlaylistId);

[ApiController]
[Route("api/admin/template-playlists")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminTemplatePlaylistsController(
    AccountsContext db,
    VeggieBookContext content,
    UserManager<AppUser> users,
    ILogger<AdminTemplatePlaylistsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var defaults = await TemplateDefaults.LoadAsync(db, content);
        var archived = (await db.Playlists
                .AsNoTracking()
                .Where(p => p.ArchivedAt != null)
                .Select(p => p.Id)
                .ToListAsync())
            .ToHashSet();

        Response.Headers.CacheControl = "no-store";
        return Ok(defaults.Select(d => new
        {
            templateKey = d.TemplateKey,
            vegetable = d.Vegetable,
            playlistId = d.PlaylistId,
            label = d.Label,
            archived = archived.Contains(d.PlaylistId)
        }));
    }

    [HttpPut]
    public async Task<IActionResult> Set([FromBody] TemplatePlaylistRequest req)
    {
        var template = NotificationTemplates.Find(req.TemplateKey);
        if (template is null) return BadRequest(new { error = "That message template no longer exists." });

        var vegetable = template.NeedsVegetable ? (req.Vegetable ?? "").Trim() : TemplateDefaults.AnyVegetable;
        string? vegetableName = null;
        if (vegetable != TemplateDefaults.AnyVegetable)
        {
            vegetableName = await content.Vegetables
                .AsNoTracking()
                .Where(v => v.Code == vegetable && v.Active)
                .Select(v => v.NameEn)
                .FirstOrDefaultAsync();
            if (vegetableName is null) return BadRequest(new { error = "That vegetable is not available." });
        }

        var p = await db.Playlists.FirstOrDefaultAsync(x => x.Id == req.PlaylistId);
        if (p is null) return NotFound(new { error = "That playlist no longer exists. Refresh the page." });
        if (p.ArchivedAt is not null)
            return BadRequest(new { error = "Restore this playlist before making it a default." });

        var link = await db.TemplatePlaylists
            .FirstOrDefaultAsync(l => l.TemplateKey == template.Key && l.Vegetable == vegetable);
        var label = TemplateDefaults.Label(template.Key, vegetableName);
        if (link is not null && link.PlaylistId == p.Id) return Ok(new { ok = true, label });

        if (link is null)
        {
            link = new TemplatePlaylist { TemplateKey = template.Key, Vegetable = vegetable };
            db.TemplatePlaylists.Add(link);
        }
        link.PlaylistId = p.Id;
        link.UpdatedAt = DateTime.UtcNow;
        link.UpdatedBy = AdminId();
        await db.SaveChangesAsync();

        await PlaylistActivity.RecordAdminAsync(
            db, logger, PlaylistActivity.Edited, p, $"Default for \"{label}\"", AdminId());
        return Ok(new { ok = true, label });
    }

    [HttpDelete]
    public async Task<IActionResult> Clear([FromQuery] string? templateKey, [FromQuery] string? vegetable)
    {
        var key = templateKey ?? "";
        var veg = (vegetable ?? "").Trim();
        var link = await db.TemplatePlaylists.FirstOrDefaultAsync(l => l.TemplateKey == key && l.Vegetable == veg);
        if (link is null) return Ok(new { ok = true });

        var vegetableName = veg == TemplateDefaults.AnyVegetable
            ? null
            : await content.Vegetables.AsNoTracking().Where(v => v.Code == veg).Select(v => v.NameEn).FirstOrDefaultAsync() ?? veg;
        var label = TemplateDefaults.Label(key, vegetableName);

        db.TemplatePlaylists.Remove(link);
        await db.SaveChangesAsync();

        var p = await db.Playlists.FirstOrDefaultAsync(x => x.Id == link.PlaylistId);
        if (p is not null)
            await PlaylistActivity.RecordAdminAsync(
                db, logger, PlaylistActivity.Edited, p, $"No longer default for \"{label}\"", AdminId());
        return Ok(new { ok = true });
    }

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}