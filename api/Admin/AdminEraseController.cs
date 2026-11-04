using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Erasing a participant, main admin only. See ParticipantErase.cs.
//
//   GET  /api/admin/erase/{researchId}   what would be erased
//   POST /api/admin/erase                { researchId, level, confirmId, confirmPhrase }
//
// confirmId must repeat the research ID. "everything" also needs
// confirmPhrase to be ERASE EVERYTHING. Admin accounts and the signed-in
// admin are refused.

public record EraseRequest(string? ResearchId, string? Level, string? ConfirmId, string? ConfirmPhrase);

[ApiController]
[Route("api/admin/erase")]
[Authorize(Policy = Roles.AdminPolicy)]
[RootAdminOnly]
public class AdminEraseController(
    AccountsContext db,
    UserManager<AppUser> users,
    ILogger<AdminEraseController> logger) : ControllerBase
{
    [HttpGet("{researchId}")]
    public async Task<IActionResult> Preview(string researchId)
    {
        var t = await ParticipantErase.FindAsync(db, researchId);
        if (t is null) return NotFound(new { error = "No account has this research ID." });

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            researchId = t.ResearchId,
            accountDeleted = t.AccountDeleted,
            isAdmin = t.IsAdmin,
            booksInApp = t.BooksInApp,
            booksKept = t.BooksKept,
            trackingOn = t.TrackingOn,
            trackingChanges = t.TrackingChanges,
            notices = t.Notices
        });
    }

    [HttpPost]
    public async Task<IActionResult> Erase([FromBody] EraseRequest req)
    {
        var adminId = AuthSetup.UserId(User);
        if (adminId is null) return Unauthorized();

        var level = req.Level ?? "";
        if (!ParticipantErase.Levels.Contains(level))
            return BadRequest(new { error = "Choose what to erase." });

        var t = await ParticipantErase.FindAsync(db, req.ResearchId ?? "");
        if (t is null) return NotFound(new { error = "No account has this research ID." });

        if (t.UserId == adminId)
            return Conflict(new { error = "You can't erase your own account." });
        if (t.IsAdmin)
            return Conflict(new { error = "Remove this account's admin access before erasing it." });

        if (ParticipantErase.Normalize(req.ConfirmId) != t.ResearchId)
            return BadRequest(new { error = "The research ID typed to confirm does not match." });
        if (level == ParticipantErase.Everything && (req.ConfirmPhrase ?? "").Trim() != ParticipantErase.EverythingPhrase)
            return BadRequest(new { error = $"Type {ParticipantErase.EverythingPhrase} to confirm." });

        int books;
        try
        {
            books = await ParticipantErase.EraseAsync(db, users, t, level, adminId.Value);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erase failed for {ResearchId} at level {Level}.", t.ResearchId, level);
            return StatusCode(500, new { error = "The erase did not finish. Nothing was logged; try again." });
        }

        await ActivityLog.SaveAsync(db, logger, ParticipantErase.LogLine(t.ResearchId, level, books));

        return Ok(new { level, booksErased = books });
    }
}