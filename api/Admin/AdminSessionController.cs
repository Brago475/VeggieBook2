using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Who is signed in to the admin site.
//
//   GET /api/admin/session
//
// Admins only (Roles.AdminPolicy). The admin site calls this after sign-in
// to learn whether the signed-in admin is the root admin, which it shows
// with a different badge color. /api/auth/me is shared with the public
// site, so admin-only details stay out of it.

[ApiController]
[Route("api/admin/session")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminSessionController(UserManager<AppUser> users, IConfiguration config)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        return Ok(new
        {
            email = user.Email,
            isRootAdmin = AdminRules.IsRoot(config, user.Email)
        });
    }
}