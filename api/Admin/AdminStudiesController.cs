using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The Studies page: every study, the on/off switch, and renaming or
// deleting a study.
//
//   GET    /api/admin/studies             every study, newest first, with
//                                         its numbers (StudyData.Summary),
//                                         plus a preview of who a study
//                                         switched on now would include
//   POST   /api/admin/studies/start       switch a study on: Study N+1
//                                         starts now
//   POST   /api/admin/studies/stop        switch the running study off now
//   POST   /api/admin/studies/{id}/name   rename a study: { "name": "..." }.
//                                         An empty name goes back to plain
//                                         "Study N". The number never changes.
//   DELETE /api/admin/studies/{id}        delete an ended study:
//                                         { "confirm": "<its name>" }
//
// Admins only (Roles.AdminPolicy). Switching on needs no name or dates: the
// study is numbered and starts the moment it is switched on, and ends the
// moment it is switched off. Only one runs at a time; the database's unique
// index refuses a second, even if two admins click at the same moment.
//
// Deleting removes the study and its notice answers (the database removes
// the notices with it). Books are never touched: they stay in All Data.
// Tracking choices are not touched either. A running study can't be
// deleted; switch it off first. The confirm text must match the study's
// name (or "Study N" if it has none), the same check the page asks for.
//
// See Research/StudyTracking.cs for who is tracked and who sees the notice.

public record StudyNameRequest(string? Name);
public record StudyDeleteRequest(string? Confirm);

[ApiController]
[Route("api/admin/studies")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminStudiesController(AccountsContext db, UserManager<AppUser> users) : ControllerBase
{
    private const int MaxName = 60;

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var now = DateTime.UtcNow;
        var data = await StudyData.LoadAsync(db);

        var studies = await db.Studies
            .AsNoTracking()
            .OrderByDescending(s => s.Number)
            .ToListAsync();

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            running = studies.Any(s => s.EndedAt is null),
            nextNumber = (studies.Count == 0 ? 0 : studies.Max(s => s.Number)) + 1,
            preview = data.Preview(now),
            studies = studies.Select(s => data.Summary(s, now)).ToList()
        });
    }

    [HttpPost("start")]
    public async Task<IActionResult> Start()
    {
        if (await StudyTracking.RunningAsync(db) is not null)
            return Conflict(new { error = "A study is already running. Switch it off first." });

        var last = await db.Studies.MaxAsync(s => (int?)s.Number) ?? 0;
        var study = new Study
        {
            Number = last + 1,
            StartedAt = DateTime.UtcNow,
            StartedBy = AdminId()
        };
        db.Studies.Add(study);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Another admin switched one on at the same moment.
            return Conflict(new { error = "A study is already running. Refresh to see it." });
        }

        var data = await StudyData.LoadAsync(db);
        return Ok(data.Summary(study, DateTime.UtcNow));
    }

    [HttpPost("stop")]
    public async Task<IActionResult> Stop()
    {
        var study = await db.Studies.FirstOrDefaultAsync(s => s.EndedAt == null);
        if (study is null)
            return Conflict(new { error = "No study is running." });

        study.EndedAt = DateTime.UtcNow;
        study.EndedBy = AdminId();
        await db.SaveChangesAsync();

        var data = await StudyData.LoadAsync(db);
        return Ok(data.Summary(study, DateTime.UtcNow));
    }

    [HttpPost("{id:int}/name")]
    public async Task<IActionResult> Rename(int id, [FromBody] StudyNameRequest request)
    {
        var study = await db.Studies.FirstOrDefaultAsync(s => s.Id == id);
        if (study is null)
            return NotFound(new { error = "That study no longer exists. Refresh the page." });

        var name = request.Name?.Trim();
        if (string.IsNullOrEmpty(name)) name = null;
        if (name is not null && name.Length > MaxName)
            return BadRequest(new { error = $"Keep the name to {MaxName} characters or fewer." });

        study.Name = name;
        await db.SaveChangesAsync();

        var data = await StudyData.LoadAsync(db);
        return Ok(data.Summary(study, DateTime.UtcNow));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromBody] StudyDeleteRequest request)
    {
        var study = await db.Studies.FirstOrDefaultAsync(s => s.Id == id);
        if (study is null)
            return NotFound(new { error = "That study no longer exists. Refresh the page." });

        if (study.EndedAt is null)
            return Conflict(new { error = "This study is still running. Switch it off before deleting it." });

        var title = StudyData.TitleOf(study);
        if (!string.Equals(request.Confirm?.Trim(), title, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = $"Type {title} to confirm." });

        // Its notices go with it (ON DELETE CASCADE in 008_studies.sql).
        db.Studies.Remove(study);
        await db.SaveChangesAsync();

        return Ok(new { deleted = id, title });
    }

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}