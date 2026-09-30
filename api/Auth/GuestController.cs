using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Account endpoints, part 4: guests.
//
//   POST /api/auth/guest   start a guest session
//
// The guest's session cookie is not persistent, so it ends when the browser
// closes. The account itself is deleted on sign out or after 24 hours.
// Starting guests has its own, tighter rate limit, so nobody can fill the
// database with guest accounts.

[ApiController]
[Route("api/auth")]
public class GuestController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    GuestAccounts guests) : ControllerBase
{
    [HttpPost("guest")]
    [EnableRateLimiting(AuthSetup.GuestRateLimitPolicy)]
    public async Task<IActionResult> StartGuest()
    {
        // Already signed in, as a guest or an account: nothing to start.
        var current = await users.GetUserAsync(User);
        if (current is not null)
            return Ok(await AuthHelpers.MeFor(users, current));

        var guest = await guests.CreateAsync();
        await signIn.SignInAsync(guest, isPersistent: false);
        return Ok(await AuthHelpers.MeFor(users, guest));
    }
}