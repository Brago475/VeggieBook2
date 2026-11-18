using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Books.Print;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// A playlist as a PDF, for admins.
//
//   GET /api/admin/playlists/{id}/pdf?lang=en|es&download=1
//
// Archived playlists print too. The PDF is titled with the playlist's name
// in the chosen language (English when it has no Spanish name). Each
// download is written to the activity log as an admin download.

[ApiController]
[Route("api/admin/playlists")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminPlaylistPdfController(
    AccountsContext db,
    VeggieBookContext content,
    IConfiguration config,
    ILogger<AdminPlaylistPdfController> logger) : ControllerBase
{
    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> Pdf(int id, [FromQuery] string? lang, [FromQuery] string? download)
    {
        var p = await db.Playlists.AsNoTracking().Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound(new { error = "That playlist no longer exists. Refresh the page." });

        var es = Lang.IsSpanish(lang);
        var name = es && !string.IsNullOrEmpty(p.NameEs) ? p.NameEs : p.NameEn;
        var items = p.Items
            .OrderBy(i => i.Position)
            .Select(i => new PlaylistPrintItem(i.Kind, i.ItemId))
            .ToList();

        var file = await PlaylistPdf.BuildAsync(content, name, items, es, BookImages.Root(config));
        if (file is null) return NotFound(new { error = "This playlist has nothing to print yet." });

        var save = download is "1" || string.Equals(download, "true", StringComparison.OrdinalIgnoreCase);
        if (save)
        {
            await ActivityLog.SaveAdminAsync(db, logger, ActivityLog.AdminDownload, AuthSetup.UserId(User),
                $"Playlist PDF: {p.NameEn}, {(es ? "Spanish" : "English")}", contentId: p.Id);
        }

        Response.Headers.CacheControl = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        if (save) return File(file.Bytes, "application/pdf", file.FileName);

        Response.Headers.ContentDisposition = $"inline; filename=\"{file.FileName}\"";
        return File(file.Bytes, "application/pdf");
    }
}