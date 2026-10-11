using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// The app's side of research tracking: the switch in Settings and the study
// notice. Signed-in real accounts only (Roles.MemberPolicy); guests are never
// tracked.
//
//   GET  /api/me/tracking        the person's tracking: on or off, who
//                                turned it off, and their research ID
//                                (shown only while tracking is on)
//   PUT  /api/me/tracking        { on: true | false } from the Settings switch
//   GET  /api/me/study-notice    whether to show the study notice right now
//   POST /api/me/study-notice    { answer: "joined" | "stayed_out" }
//
// The rules (see StudyTracking.cs):
//
//   Tracking is on by default. People can turn it off and back on here.
//   If an admin turned it off, it stays off: the switch says so and can't
//   be turned back on from Settings; only an admin can undo it.
//
//   The notice shows only while a study is running, only to people who
//   turned tracking off themselves, and only until they answer it once for
//   that study. "joined" turns tracking back on; "stayed_out" leaves it off.
//
//   Admin accounts are never tracked and never see the switch or the notice
//   (eligible: false).

[ApiController]
[Route("api/me")]
[Authorize(Policy = Roles.MemberPolicy)]
public class TrackingController(AccountsContext db, UserManager<AppUser> users) : ControllerBase
{
    public record TrackingRequest(bool On);
    public record NoticeRequest(string Answer);

    [HttpGet("tracking")]
    public async Task<IActionResult> Get()
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        Response.Headers.CacheControl = "no-store";

        if (await StudyTracking.IsAdminAsync(db, userId.Value))
            return Ok(new { eligible = false });

        var state = await StudyTracking.ForUserAsync(db, userId.Value);
        return Ok(await ShapeAsync(userId.Value, state));
    }

    [HttpPut("tracking")]
    public async Task<IActionResult> Set([FromBody] TrackingRequest request)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        if (await StudyTracking.IsAdminAsync(db, userId.Value))
            return Ok(new { eligible = false });

        var current = await StudyTracking.ForUserAsync(db, userId.Value);
        if (current.OffByAdmin)
            return Conflict(new { error = "Tracking was turned off by the research team." });

        var state = await StudyTracking.SetAsync(db, userId.Value, request.On, "self");
        return Ok(await ShapeAsync(userId.Value, state));
    }

    [HttpGet("study-notice")]
    public async Task<IActionResult> GetNotice()
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        Response.Headers.CacheControl = "no-store";

        var study = await NoticeStudyAsync(userId.Value);
        if (study is null) return Ok(new { show = false });

        // Remember that it was shown (once per person per study).
        var notice = await db.StudyNotices
            .FirstOrDefaultAsync(n => n.StudyId == study.Id && n.UserId == userId.Value);

        if (notice is null)
        {
            db.StudyNotices.Add(new StudyNotice
            {
                StudyId = study.Id,
                UserId = userId.Value,
                ShownAt = DateTime.UtcNow
            });
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Shown in two tabs at the same moment; the other one saved it.
                db.ChangeTracker.Clear();
            }
        }
        else if (notice.Answer is not null)
        {
            return Ok(new { show = false });
        }

        return Ok(new { show = true, studyNumber = study.Number });
    }

    [HttpPost("study-notice")]
    public async Task<IActionResult> AnswerNotice([FromBody] NoticeRequest request)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var answer = (request.Answer ?? "").Trim().ToLowerInvariant();
        if (answer is not ("joined" or "stayed_out"))
            return BadRequest(new { error = "Answer must be joined or stayed_out." });

        var study = await NoticeStudyAsync(userId.Value);
        if (study is null)
            return Conflict(new { error = "There is no study notice to answer right now." });

        var now = DateTime.UtcNow;
        var notice = await db.StudyNotices
            .FirstOrDefaultAsync(n => n.StudyId == study.Id && n.UserId == userId.Value);

        if (notice is null)
        {
            notice = new StudyNotice { StudyId = study.Id, UserId = userId.Value, ShownAt = now };
            db.StudyNotices.Add(notice);
        }
        else if (notice.Answer is not null)
        {
            return Ok(new { answer = notice.Answer });
        }

        notice.Answer = answer;
        notice.AnsweredAt = now;
        await db.SaveChangesAsync();

        if (answer == "joined")
            await StudyTracking.SetAsync(db, userId.Value, true, "self");

        return Ok(new { answer });
    }

    // The running study, if this person should get its notice: they are not
    // an admin and they turned tracking off themselves. Whether they already
    // answered is checked by the caller.
    private async Task<Study?> NoticeStudyAsync(Guid userId)
    {
        var study = await StudyTracking.RunningAsync(db);
        if (study is null) return null;

        if (await StudyTracking.IsAdminAsync(db, userId)) return null;

        var state = await StudyTracking.ForUserAsync(db, userId);
        return state.OffBySelf ? study : null;
    }

    private async Task<object> ShapeAsync(Guid userId, TrackingState state)
    {
        // The research ID is shown only while tracking is on.
        string? researchId = state.On ? await ParticipantIds.ForUserAsync(db, userId) : null;

        return new
        {
            eligible = true,
            on = state.On,
            offByAdmin = state.OffByAdmin,
            changedAt = state.ChangedAt,
            researchId
        };
    }

    private Guid? CurrentUserId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}