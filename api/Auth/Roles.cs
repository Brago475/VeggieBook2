namespace VeggieBook.Api.Auth;

// Role names. They match the rows migration 003 inserts into app_role.
//
//   Guest  a temporary account from "Continue as guest". Can make, save, and
//          read books. Deleted on sign out, or 24 hours after it was made.
//   User   every real account.
//   Admin  always held together with User. Given or removed by the root
//          admin in the admin site; the root admin is set on the server
//          (Admin__RootEmail) and can't lose the role from the site.
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