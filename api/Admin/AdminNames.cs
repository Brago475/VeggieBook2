using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Usernames for the admins named on admin pages ("by" tags and the
// Activity page). Every admin may see these; emails are never returned.
// An account that is gone or has no username shows as Former admin.

public static class AdminNames
{
    public const string Former = "Former admin";

    public static async Task<Dictionary<Guid, string>> LoadAsync(AccountsContext db, IEnumerable<Guid?> ids)
    {
        var wanted = ids.Where(i => i.HasValue).Select(i => i!.Value).Distinct().ToList();
        if (wanted.Count == 0) return [];

        var rows = await db.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => wanted.Contains(u.Id))
            .Select(u => new { u.Id, u.DisplayName })
            .ToListAsync();

        return rows
            .Where(r => !string.IsNullOrWhiteSpace(r.DisplayName))
            .ToDictionary(r => r.Id, r => r.DisplayName!);
    }

    // Null when nobody is recorded; Former admin when the account is gone.
    public static string? Of(Dictionary<Guid, string> names, Guid? id) =>
        id is Guid g ? names.GetValueOrDefault(g, Former) : null;
}