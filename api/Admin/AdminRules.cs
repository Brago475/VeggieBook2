using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Rules about admin accounts that more than one admin endpoint needs.
//
// There is one root (main) admin, set by Admin__RootEmail in the server's
// .env, not in the code. Program.cs calls RequireRootEmail at startup, so the
// API refuses to start without it.
//
// Only the root admin can see other admins, add or remove admins, and open
// identity records. Regular admins never see admin accounts at all.

public static class AdminRules
{
    private const string Setting = "Admin:RootEmail";

    public static void RequireRootEmail(IConfiguration config)
    {
        if (string.IsNullOrWhiteSpace(config[Setting]))
            throw new InvalidOperationException("Admin__RootEmail is not set.");
    }

    public static bool IsRoot(IConfiguration config, string? email) =>
        email is not null
        && string.Equals(email, config[Setting], StringComparison.OrdinalIgnoreCase);

    // True when the signed-in user is the root admin.
    public static async Task<bool> IsRootAsync(
        ClaimsPrincipal principal,
        UserManager<AppUser> users,
        IConfiguration config)
    {
        var user = await users.GetUserAsync(principal);
        return user is not null && IsRoot(config, user.Email);
    }
}