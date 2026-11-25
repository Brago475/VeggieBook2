using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.SuperTracker;

// SuperTracker2 is for real accounts only. Guests get 403 "accountRequired".

public static class SuperTrackerAccess
{
    public static async Task<bool> IsGuestAsync(AccountsContext accounts, Guid uid)
    {
        var user = await accounts.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == uid);
        return user is null || GuestAccounts.IsGuest(user);
    }

    public static ObjectResult AccountRequired() =>
        new(new { error = "SuperTracker2 needs an account.", code = "accountRequired" }) { StatusCode = 403 };
}