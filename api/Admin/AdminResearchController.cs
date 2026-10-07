using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Admin;

// The research sheets for the admin site's Research page.
//
//   GET /api/admin/research/participants          one row per participant
//   GET /api/admin/research/responses             one row per saved book
//   GET /api/admin/research/options               choices for the filters
//   GET /api/admin/research/export/{sheet}?format=xlsx|csv|pdf|spss
//                                                 a sheet as a download
//
// Filters (all optional): from and to (yyyy-MM-dd, Eastern), age, vegetable
// (a vegetable code such as BROCCOLI). Participants only uses age.
//
// Admins only (Roles.AdminPolicy). The sheets are built in
// Research/ResearchSheets.cs and the files in Research/Export/. Every row
// is keyed by the anonymous research ID; no email or name is read.

[ApiController]
[Route("api/admin/research")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminResearchController(AccountsContext db, VeggieBookContext content)
    : ControllerBase
{
    [HttpGet("participants")]
    public async Task<IActionResult> Participants([FromQuery] string? age) =>
        Ok(await ResearchSheets.ParticipantsAsync(db, ParticipantFilter(age)));

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

    [HttpGet("export/{sheet}")]
    public async Task<IActionResult> Export(
        string sheet,
        [FromQuery] string? format,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? age,
        [FromQuery] string? vegetable)
    {
        var filter = new SheetFilter(from, to, Clean(age), Clean(vegetable));

        Sheet? data = sheet switch
        {
            "participants" => await ResearchSheets.ParticipantsAsync(db, ParticipantFilter(age)),
            "responses" => await ResearchSheets.ResponsesAsync(db, content, filter),
            _ => null
        };
        if (data is null) return NotFound(new { error = "Unknown sheet." });

        var filters = Describe(sheet == "participants" ? ParticipantFilter(age) : filter);
        var baseName = $"veggiebook2-{data.Name}-{data.GeneratedAt:yyyy-MM-dd}";

        // Research data must never sit in a shared or proxy cache.
        Response.Headers.CacheControl = "no-store";

        return format switch
        {
            "csv" => File(CsvExport.Build(data), "text/csv; charset=utf-8", $"{baseName}.csv"),
            "xlsx" => File(ExcelExport.Build(data, filters),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{baseName}.xlsx"),
            "pdf" => File(PdfExport.Build(data, filters), "application/pdf", $"{baseName}.pdf"),
            "spss" => File(SpssExport.Build(data, filters, baseName), "application/zip", $"{baseName}-spss.zip"),
            _ => BadRequest(new { error = "Format must be xlsx, csv, pdf, or spss." })
        };
    }

    private static SheetFilter ParticipantFilter(string? age) => new(null, null, Clean(age), null);

    private static string Describe(SheetFilter f)
    {
        var parts = new List<string>();
        if (f.From is not null) parts.Add($"from {f.From:yyyy-MM-dd}");
        if (f.To is not null) parts.Add($"to {f.To:yyyy-MM-dd}");
        if (f.AgeRange is not null) parts.Add($"age {f.AgeRange}");
        if (f.Vegetable is not null) parts.Add($"vegetable {f.Vegetable}");
        return parts.Count == 0 ? "none" : string.Join(", ", parts);
    }

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}