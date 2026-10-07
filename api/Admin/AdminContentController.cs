using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Content the admin site opens from its lists.
//
//   GET /api/admin/content/secrets/{id}    one secret, in full, in English
//
// Admins only (Roles.AdminPolicy). Read-only: the content database is never
// changed here.
//
// Recipes don't need an endpoint here: the admin site uses the public
// /api/recipes/{id}, the same one the public site uses. Secrets do, because
// the public API only returns them a whole category at a time.
//
// Retired secrets are returned too (active = false), since a saved book can
// still hold one.

[ApiController]
[Route("api/admin/content")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminContentController(VeggieBookContext content) : ControllerBase
{
    [HttpGet("secrets/{id:int}")]
    public async Task<IActionResult> Secret(int id)
    {
        var secret = await content.Secrets
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new
            {
                id = s.Id,
                number = s.DisplayNumber,
                active = s.Active,
                category = s.Category == null ? null : s.Category.NameEn,
                headline = s.HeadlineEn,
                body = s.BodyEn,
                whyItWorks = s.WhyItWorksEn,
                image = s.ImagePathEn,
                attachment = s.AttachmentEn,
                links = s.Links
                    .Where(l => l.Language == "en")
                    .Select(l => new { url = l.Url, label = l.LabelEn })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        return secret is null ? NotFound() : Ok(secret);
    }
}