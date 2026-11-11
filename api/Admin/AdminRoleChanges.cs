using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Giving and removing the Admin role. Shared by AdminRolesController and
// Settings (add by email) so both log the same way. The activity line names
// the account by username only.
//
// A second click that arrives at the same moment ends as AlreadyAdmin or
// NotAdmin instead of an error.

public static class AdminRoleChanges
{
    public enum Result { Done, AlreadyAdmin, NotAdmin, Failed }

    public static async Task<Result> GrantAsync(
        UserManager<AppUser> users,
        AccountsContext db,
        ILogger logger,
        AppUser user,
        Guid? by)
    {
        if (await users.IsInRoleAsync(user, Roles.Admin)) return Result.AlreadyAdmin;

        if (!await TryAsync(() => users.AddToRoleAsync(user, Roles.Admin)))
            return await users.IsInRoleAsync(user, Roles.Admin) ? Result.AlreadyAdmin : Result.Failed;

        await ActivityLog.SaveAdminAsync(db, logger, ActivityLog.AdminRoleGiven, by, Label(user));
        return Result.Done;
    }

    public static async Task<Result> RevokeAsync(
        UserManager<AppUser> users,
        AccountsContext db,
        ILogger logger,
        AppUser user,
        Guid? by)
    {
        if (!await users.IsInRoleAsync(user, Roles.Admin)) return Result.NotAdmin;

        if (!await TryAsync(() => users.RemoveFromRoleAsync(user, Roles.Admin)))
            return await users.IsInRoleAsync(user, Roles.Admin) ? Result.Failed : Result.NotAdmin;

        await ActivityLog.SaveAdminAsync(db, logger, ActivityLog.AdminRoleRemoved, by, Label(user));
        return Result.Done;
    }

    // Username at the time of the change, so the line still reads well later.
    private static string Label(AppUser user) =>
        string.IsNullOrWhiteSpace(user.DisplayName) ? "an account with no username" : user.DisplayName;

    private static async Task<bool> TryAsync(Func<Task<IdentityResult>> change)
    {
        try
        {
            return (await change()).Succeeded;
        }
        catch (DbUpdateException)
        {
            return false;
        }
    }
}