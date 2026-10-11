using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The Participants page: who is tracked, who turned it off, and the switch
// an admin uses to take someone out.
//
//   GET  /api/admin/participants
//        the running study (or null), counts, and one row per person:
//        research ID, age range, date joined, tracking status, the notice
//        (for the running study), and a short count of their books
//   POST /api/admin/participants/{researchId}/tracking-off
//        an admin turns this person's tracking off, even if they have it
//        on. They are not sent the notice afterward.
//   POST /api/admin/participants/{researchId}/tracking-on
//        undoes an admin's turn-off. Refused if the person turned it off
//        themselves: only they can turn it back on, in Settings.
//
// Admins only (Roles.AdminPolicy). People are found and shown by research
// ID only; no email or name is read or sent. Admins and guests never appear.

[ApiController]
[Route("api/admin/participants")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminParticipantsController(AccountsContext db, UserManager<AppUser> users) : ControllerBase
{
    public record TrackingDto(bool On, string? ChangedBy, DateTime? ChangedAt);
    public record NoticeDto(DateTime ShownAt, string? Answer, DateTime? AnsweredAt);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var now = DateTime.UtcNow;
        var data = await StudyData.LoadAsync(db);
        var running = await StudyTracking.RunningAsync(db);

        var booksBy = data.Books.ToLookup(b => b.UserId);
        var notices = running is null
            ? new Dictionary<Guid, StudyNotice>()
            : data.Notices.Where(n => n.StudyId == running.Id).ToDictionary(n => n.UserId);

        var people = data.People
            .OrderByDescending(p => p.CreatedAt)
            .Select(p =>
            {
                var state = data.History.At(p.Id, now);
                var own = booksBy[p.Id].ToList();
                notices.TryGetValue(p.Id, out var notice);

                return new
                {
                    researchId = data.IdOf(p.Id),
                    ageRange = p.AgeRange,
                    joinedAt = p.CreatedAt,
                    status = StatusOf(state),
                    tracking = new TrackingDto(state.On, state.ChangedBy, state.ChangedAt),
                    notice = notice is null
                        ? null
                        : new NoticeDto(notice.ShownAt, notice.Answer, notice.AnsweredAt),
                    books = own.Count,
                    veggieBooks = own.Count(b => b.Kind == "veggie"),
                    secretsBooks = own.Count(b => b.Kind == "secrets"),
                    latestBookAt = own.Count == 0 ? (DateTime?)null : own.Max(b => b.CreatedAt)
                };
            })
            .ToList();

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            study = running is null ? null : data.Summary(running, now),
            counts = new
            {
                all = people.Count,
                on = people.Count(p => p.status == "on"),
                offSelf = people.Count(p => p.status == "off_self"),
                offAdmin = people.Count(p => p.status == "off_admin")
            },
            people
        });
    }

    [HttpPost("{researchId}/tracking-off")]
    public async Task<IActionResult> TrackingOff(string researchId)
    {
        var userId = await FindAsync(researchId);
        if (userId is null) return NotFound();

        var state = await StudyTracking.SetAsync(db, userId.Value, false, "admin", AdminId());
        return Ok(new { status = StatusOf(state) });
    }

    [HttpPost("{researchId}/tracking-on")]
    public async Task<IActionResult> TrackingOn(string researchId)
    {
        var userId = await FindAsync(researchId);
        if (userId is null) return NotFound();

        var current = await StudyTracking.ForUserAsync(db, userId.Value);
        if (current.On) return Ok(new { status = StatusOf(current) });

        if (current.OffBySelf)
            return Conflict(new { error = "This person turned tracking off. Only they can turn it back on, in Settings." });

        var state = await StudyTracking.SetAsync(db, userId.Value, true, "admin", AdminId());
        return Ok(new { status = StatusOf(state) });
    }

    // on, off_self (they turned it off), or off_admin (an admin did).
    private static string StatusOf(TrackingState state) =>
        state.On ? "on" : state.OffByAdmin ? "off_admin" : "off_self";

    // The account behind a research ID, if it is someone a study can include.
    private async Task<Guid?> FindAsync(string researchId)
    {
        var id = (researchId ?? "").Trim().ToUpperInvariant();

        var userId = await db.ResearchParticipants
            .AsNoTracking()
            .Where(p => p.ParticipantId == id)
            .Select(p => (Guid?)p.UserId)
            .FirstOrDefaultAsync();
        if (userId is null) return null;

        var people = await StudyTracking.PeopleAsync(db);
        return await people.AnyAsync(u => u.Id == userId) ? userId : null;
    }

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}