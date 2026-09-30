namespace VeggieBook.Api.Auth;

// Role names. They match the rows migration 003 inserts into app_role.
//
//   Guest  a temporary account from "Continue as guest". Can make, save, and
//          read books. Deleted on sign out, or 24 hours after it was made.
//   User   every real account.
//   Admin  given only by hand on the server, always together with User, so
//          no screen or endpoint can make someone an admin.
public static class Roles
{
    public const string Guest = "Guest";
    public const string User = "User";
    public const string Admin = "Admin";

    // Real accounts only. Guests are refused (account settings, passwords).
    public const string MemberPolicy = "member";

    // Admins only. Everyone else is refused.
    public const string AdminPolicy = "admin";
}