using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The research sheets for the admin site's Research page.
//
//   GET /api/admin/research/participants   one row per participant
//   GET /api/admin/research/responses      one row per saved book
//   GET /api/admin/research/options        choices for the page's filters
//
// Filters (all optional): from and to (yyyy-MM-dd, Eastern), age, vegetable
// (a vegetable code such as BROCCOLI). Participants only uses age.
//
// Admins only (Roles.AdminPolicy). The sheets themselves are built in
// Research/ResearchSheets.cs; every row is keyed by the anonymous research
// ID, and no email or name is read.
//
// Exports (Excel, CSV, SPSS, PDF) come next and will use the same sheets.

[ApiController]
[Route("api/admin/research")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminResearchController(AccountsContext db, VeggieBookContext content)
    : ControllerBase
{
    [HttpGet("participants")]
    public async Task<IActionResult> Participants(
        [FromQuery] string? age) =>
        Ok(await ResearchSheets.ParticipantsAsync(db, new SheetFilter(null, null, Clean(age), null)));

    [HttpGet("responses")]
    public async Task<IActionResult> Responses(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? age,
        [FromQuery] string? vegetable) =>
        Ok(await ResearchSheets.ResponsesAsync(
            db, content, new SheetFilter(from, to, Clean(age), Clean(vegetable))));

    [HttpGet("options")]
    public async Task<IActionResult> Options() =>
        Ok(await ResearchSheets.OptionsAsync(db, content));

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}