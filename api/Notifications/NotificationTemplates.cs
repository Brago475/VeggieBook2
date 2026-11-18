namespace VeggieBook.Api.Notifications;

// The pilot-test messages rated most appealing, with fixed Spanish (tú).
// A template sent with its English unchanged also shows in Spanish; any
// other message shows its English to everyone.
//
// {vegetable} is filled with the vegetable the admin picks when sending.
// The choices come from SeasonVegetables.

// En and Es fill the slot; Name is shown in the admin site.
public record NotificationVegetable(string Key, string En, string Es, string Name);

public record NotificationTemplate(string Key, string En, string Es)
{
    public bool NeedsVegetable => En.Contains(NotificationTemplates.Slot);
}

public static class NotificationTemplates
{
    public const string Slot = "{vegetable}";

    // The first pilot list. No longer offered; kept so older messages resolve.
    public static readonly NotificationVegetable[] Legacy =
    [
        new("cucumbers", "cucumbers", "pepinos", "Cucumbers"),
        new("lettuce", "lettuce", "lechuga", "Lettuce"),
        new("tomatoes", "tomatoes", "tomates", "Tomatoes"),
        new("peppers", "peppers", "pimientos", "Peppers"),
    ];

    public static readonly NotificationTemplate[] All =
    [
        new("finals",
            "Fuel up for finals with delicious vegetables.",
            "Recarga energía para los finales con verduras deliciosas."),
        new("same_start",
            "Canned, frozen, or fresh veggies all start out the same.",
            "Las verduras enlatadas, congeladas o frescas empiezan igual."),
        new("in_season",
            "Study strong with cool, refreshing {vegetable}, in season at Kean's Cougar Pantry or a supermarket near you.",
            "Estudia con energía con algo fresco y refrescante: {vegetable}, de temporada en el Cougar Pantry de Kean o en un supermercado cerca de ti."),
        new("snack_break",
            "Need a break? Grab veggies for a refreshing snack!",
            "¿Necesitas un descanso? ¡Toma unas verduras para una merienda refrescante!"),
        new("cooking",
            "Want to learn about cooking? Check out https://projectnourish.github.io/index.html for tasty recipes!",
            "¿Quieres aprender a cocinar? ¡Visita https://projectnourish.github.io/index.html para ver recetas sabrosas!"),
    ];

    public static NotificationTemplate? Find(string? key) =>
        All.FirstOrDefault(t => t.Key == key);

    // The template's English and Spanish with the vegetable filled in.
    // Null when the template needs a vegetable and none was given.
    public static (string En, string Es)? Fill(NotificationTemplate template, NotificationVegetable? vegetable)
    {
        if (!template.NeedsVegetable) return (template.En, template.Es);
        if (vegetable is null) return null;
        return (template.En.Replace(Slot, vegetable.En), template.Es.Replace(Slot, vegetable.Es));
    }

    // The Spanish for a message, or null when its English is not an
    // unchanged template. Compared after trimming, so stray spaces don't count.
    public static string? SpanishFor(string? templateKey, NotificationVegetable? vegetable, string bodyEn)
    {
        var template = Find(templateKey);
        if (template is null) return null;

        var filled = Fill(template, vegetable);
        if (filled is null) return null;

        return filled.Value.En == bodyEn.Trim() ? filled.Value.Es : null;
    }
}