namespace VeggieBook.Api.Admin;

// Rules about admin accounts that more than one admin endpoint needs.
//
// The root admin is the first admin account, set up by hand on the server.
// It can never lose its Admin role through the admin site, so the site can
// always be reached with at least one account. Changing or removing it is
// done on the server.
//
// The root email can be overridden with Admin__RootEmail in the server's
// environment, for example if the next team uses a different address.

public static class AdminRules
{
    public const string DefaultRootEmail = "admin@veggiebook2.com";

    public static string RootEmail(IConfiguration config) =>
        config["Admin:RootEmail"] is { Length: > 0 } email ? email : DefaultRootEmail;

    public static bool IsRoot(IConfiguration config, string? email) =>
        email is not null
        && string.Equals(email, RootEmail(config), StringComparison.OrdinalIgnoreCase);
}