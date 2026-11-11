using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Rules about admin accounts shared by admin endpoints.
//
// There is one root (main) admin, set by Admin__RootEmail in the server's
// .env, not in the code. Program.cs calls RequireRootEmail at startup, so the
// API refuses to start without it.
//
// Being root needs both the root email and the Admin role. Only the root
// admin can manage admins and open identity records.

public static class AdminRules
{
    private const string Setting = "Admin:RootEmail";

    public static void RequireRootEmail(IConfiguration config)
    {
        if (string.IsNullOrWhiteSpace(config[Setting]))
            throw new InvalidOperationException("Admin__RootEmail is not set.");
    }

    // True when this email is the root email. Used for labels only; access
    // checks go through IsRootAsync.
    public static bool IsRoot(IConfiguration config, string? email) =>
        email is not null
        && string.Equals(email, config[Setting], StringComparison.OrdinalIgnoreCase);

    // True when the signed-in user has the root email and the Admin role.
    public static async Task<bool> IsRootAsync(
        ClaimsPrincipal principal,
        UserManager<AppUser> users,
        IConfiguration config)
    {
        var user = await users.GetUserAsync(principal);
        return user is not null
            && IsRoot(config, user.Email)
            && await users.IsInRoleAsync(user, Roles.Admin);
    }
}