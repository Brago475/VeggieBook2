using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Settings the public site needs.
//
//   GET /api/settings   { guestsAllowed }
//
// Open to everyone; holds nothing private.

[ApiController]
[Route("api/settings")]
public class SiteSettingsController(AccountsContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(new { guestsAllowed = await SiteSettings.GuestsAllowedAsync(db) });
    }
}