using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The Studies page: every study, and the on/off switch.
//
//   GET  /api/admin/studies         every study, newest first, with its
//                                   numbers (StudyData.Summary), plus a
//                                   preview of who a study switched on now
//                                   would include
//   POST /api/admin/studies/start   switch a study on: Study N+1 starts now
//   POST /api/admin/studies/stop    switch the running study off now
//
// Admins only (Roles.AdminPolicy). Switching on needs no name or dates: the
// study is numbered and starts the moment it is switched on, and ends the
// moment it is switched off. Only one runs at a time; the database's unique
// index refuses a second, even if two admins click at the same moment.
//
// See Research/StudyTracking.cs for who is tracked and who sees the notice.

[ApiController]
[Route("api/admin/studies")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminStudiesController(AccountsContext db, UserManager<AppUser> users) : ControllerBase
{
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

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}