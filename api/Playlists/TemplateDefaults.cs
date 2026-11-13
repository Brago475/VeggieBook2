using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;
using VeggieBook.Api.Notifications;

namespace VeggieBook.Api.Playlists;

// Default playlists for notification templates, each with a short label:
// the template's English, plus the vegetable when the link is for one.

public record TemplateDefault(string TemplateKey, string Vegetable, int PlaylistId, string Label);

public static class TemplateDefaults
{
    // Stored vegetable for a template without a slot, or for any vegetable.
    public const string AnyVegetable = "";

    private const int LabelLength = 48;

    public static async Task<List<TemplateDefault>> LoadAsync(AccountsContext db, VeggieBookContext content)
    {
        var links = await db.TemplatePlaylists.AsNoTracking().ToListAsync();
        if (links.Count == 0) return [];

        var codes = links.Select(l => l.Vegetable).Where(v => v != AnyVegetable).Distinct().ToArray();
        var names = await content.Vegetables
            .AsNoTracking()
            .Where(v => codes.Contains(v.Code))
            .ToDictionaryAsync(v => v.Code, v => v.NameEn);

        return links
            .Select(l => new TemplateDefault(
                l.TemplateKey,
                l.Vegetable,
                l.PlaylistId,
                Label(l.TemplateKey, l.Vegetable == AnyVegetable ? null : names.GetValueOrDefault(l.Vegetable) ?? l.Vegetable)))
            .OrderBy(d => Order(d.TemplateKey))
            .ThenBy(d => d.Vegetable)
            .ToList();
    }

    // "Fuel up for finals with delicious vegetables." or
    // "Study strong with cool, refreshing ... (Broccoli)".
    public static string Label(string templateKey, string? vegetableName)
    {
        var template = NotificationTemplates.Find(templateKey);
        if (template is null) return templateKey;

        var text = template.En.Replace(NotificationTemplates.Slot, "...");
        if (text.Length > LabelLength) text = text[..LabelLength].TrimEnd() + "...";
        if (!template.NeedsVegetable) return text;
        return $"{text} ({vegetableName ?? "any vegetable"})";
    }

    private static int Order(string key)
    {
        var i = Array.FindIndex(NotificationTemplates.All, t => t.Key == key);
        return i < 0 ? int.MaxValue : i;
    }
}