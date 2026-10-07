namespace VeggieBook.Api.Admin;

// Rules about admin accounts that more than one admin endpoint needs.
//
// The root admin is the first admin account, set up by hand on the server.
// It can never lose its Admin role through the admin site, so the site can
// always be reached with at least one account. Changing or removing it is
// done on the server.
//
// Its email is set by Admin__RootEmail in the server's .env, not in the
// code, so the public repository does not name the account. Program.cs calls
// RequireRootEmail at startup, so the API refuses to start without it.

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
}