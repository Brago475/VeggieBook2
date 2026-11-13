using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Notifications;

// Vegetables offered for a template's {vegetable} slot: the active VeggieBook
// vegetables, in book order. Names are lowercased to fit inside a sentence.
// Keys from the first pilot list still resolve, so older messages keep
// their Spanish when edited.

public static class SeasonVegetables
{
    public static async Task<List<NotificationVegetable>> LoadAsync(VeggieBookContext content)
    {
        var rows = await content.Vegetables
            .AsNoTracking()
            .Where(v => v.Active)
            .OrderBy(v => v.SortOrder)
            .Select(v => new { v.Code, v.NameEn, v.NameEs })
            .ToListAsync();
        return rows.Select(r => From(r.Code, r.NameEn, r.NameEs)).ToList();
    }

    public static async Task<NotificationVegetable?> FindAsync(VeggieBookContext content, string? key)
    {
        if (string.IsNullOrWhiteSpace(key)) return null;
        var code = key.Trim();

        var row = await content.Vegetables
            .AsNoTracking()
            .Where(v => v.Code == code && v.Active)
            .Select(v => new { v.Code, v.NameEn, v.NameEs })
            .FirstOrDefaultAsync();
        if (row is not null) return From(row.Code, row.NameEn, row.NameEs);

        return NotificationTemplates.Legacy.FirstOrDefault(v => v.Key == code);
    }

    private static NotificationVegetable From(string code, string nameEn, string? nameEs) =>
        new(code,
            nameEn.ToLowerInvariant(),
            (string.IsNullOrWhiteSpace(nameEs) ? nameEn : nameEs).ToLowerInvariant(),
            nameEn);
}