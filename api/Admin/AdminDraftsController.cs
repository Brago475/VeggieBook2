using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Drafts of new playlists and notifications.
//
//   GET    /api/admin/drafts?kind=playlist|notification   newest first
//   POST   /api/admin/drafts                              body { kind, title, payload }
//   PUT    /api/admin/drafts/{id}                         body { title, payload }
//   DELETE /api/admin/drafts/{id}
//
// payload is the editor's state, stored as given and only checked for shape
// and size; finishing a draft goes through the normal create endpoint and
// its checks. Drafts never reach the app and are not written to the
// activity log; the finished playlist or notification is. Every admin sees
// every draft, with who saved it.

public record DraftRequest(string? Kind, string? Title, JsonElement? Payload);

[ApiController]
[Route("api/admin/drafts")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminDraftsController(AccountsContext db) : ControllerBase
{
    private const int MaxTitle = 120;
    private const int MaxPayload = 200_000;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? kind)
    {
        var query = db.AdminDrafts.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(kind)) query = query.Where(d => d.Kind == kind);

        var rows = await query.OrderByDescending(d => d.UpdatedAt ?? d.CreatedAt).ToListAsync();
        var names = await AdminNames.LoadAsync(db, rows.SelectMany(d => new[] { d.CreatedBy, d.UpdatedBy }));

        Response.Headers.CacheControl = "no-store";
        return Ok(rows.Select(d => new
        {
            id = d.Id,
            kind = d.Kind,
            title = d.Title,
            payload = JsonSerializer.Deserialize<JsonElement>(d.Payload),
            createdAt = d.CreatedAt,
            createdBy = AdminNames.Of(names, d.CreatedBy),
            updatedAt = d.UpdatedAt,
            updatedBy = AdminNames.Of(names, d.UpdatedBy)
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DraftRequest req)
    {
        if (req.Kind is not (AdminDraft.KindPlaylist or AdminDraft.KindNotification))
            return BadRequest(new { error = "Unknown kind of draft." });

        var (title, payload, error) = Parse(req);
        if (payload is null) return BadRequest(new { error });

        var draft = new AdminDraft
        {
            Kind = req.Kind,
            Title = title,
            Payload = payload,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = AuthSetup.UserId(User)
        };
        db.AdminDrafts.Add(draft);
        await db.SaveChangesAsync();
        return Ok(new { id = draft.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] DraftRequest req)
    {
        var draft = await db.AdminDrafts.FirstOrDefaultAsync(d => d.Id == id);
        if (draft is null) return NotFound(new { error = "That draft no longer exists. It may have been finished or discarded." });

        var (title, payload, error) = Parse(req);
        if (payload is null) return BadRequest(new { error });

        draft.Title = title;
        draft.Payload = payload;
        draft.UpdatedAt = DateTime.UtcNow;
        draft.UpdatedBy = AuthSetup.UserId(User);
        await db.SaveChangesAsync();
        return Ok(new { id = draft.Id });
    }

    // Deleting twice is harmless.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var draft = await db.AdminDrafts.FirstOrDefaultAsync(d => d.Id == id);
        if (draft is not null)
        {
            db.AdminDrafts.Remove(draft);
            await db.SaveChangesAsync();
        }
        return Ok(new { ok = true });
    }

    private static (string? Title, string? Payload, string? Error) Parse(DraftRequest req)
    {
        var title = (req.Title ?? "").Trim();
        if (title.Length > MaxTitle) title = title[..MaxTitle];

        if (req.Payload is not JsonElement body || body.ValueKind != JsonValueKind.Object)
            return (null, null, "The draft could not be read. Try again.");

        var raw = body.GetRawText();
        if (raw.Length > MaxPayload) return (null, null, "This draft is too large to save.");

        return (title.Length == 0 ? null : title, raw, null);
    }
}