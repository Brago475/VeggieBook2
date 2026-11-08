using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Playlists;

// Automatic playlists: every tip and recipe with one meal label for one
// vegetable. Tips come first, then recipes, in code order. One playlist per
// vegetable and meal; sending it again refreshes its items and restores it
// if it was archived.

public static class AutoPlaylists
{
    public static async Task<List<PlaylistRef>> MatchAsync(
        AccountsContext db,
        VeggieBookContext content,
        string vegetable,
        string meal)
    {
        var labeled = await db.MealLabels
            .AsNoTracking()
            .Where(m => m.Meal == meal)
            .Select(m => new { m.Kind, m.ItemId })
            .ToListAsync();
        var tipIds = labeled.Where(l => l.Kind == PlaylistKinds.Tip).Select(l => l.ItemId).ToArray();
        var recipeIds = labeled.Where(l => l.Kind == PlaylistKinds.Recipe).Select(l => l.ItemId).ToArray();

        var tips = await content.Tips
            .AsNoTracking()
            .Where(t => tipIds.Contains(t.Id) && t.VegetableCode == vegetable)
            .OrderBy(t => t.SortOrder)
            .Select(t => t.Id)
            .ToListAsync();

        var recipes = await content.Recipes
            .AsNoTracking()
            .Where(r => recipeIds.Contains(r.Id) && r.Active && r.VegetableCode == vegetable)
            .OrderBy(r => r.DisplayCode == null)
            .ThenBy(r => r.DisplayCode)
            .ThenBy(r => r.Id)
            .Select(r => r.Id)
            .ToListAsync();

        return tips.Select(id => new PlaylistRef(PlaylistKinds.Tip, id))
            .Concat(recipes.Select(id => new PlaylistRef(PlaylistKinds.Recipe, id)))
            .Take(PlaylistHelpers.MaxItems)
            .ToList();
    }

    public static async Task<(Playlist? Playlist, string? Error)> EnsureAsync(
        AccountsContext db,
        VeggieBookContext content,
        ILogger logger,
        string? vegetableCode,
        string? mealKey,
        Guid? adminId)
    {
        var meal = Meals.Find(mealKey);
        if (meal is null) return (null, "Pick Breakfast, Lunch, Dinner, or Snack for the playlist.");

        var veg = await content.Vegetables
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Code == vegetableCode && v.Active);
        if (veg is null) return (null, "Pick a vegetable for the playlist.");

        var refs = await MatchAsync(db, content, veg.Code, meal.Key);
        if (refs.Count == 0)
            return (null, $"Nothing is labeled {meal.En} for {veg.NameEn} yet. Add labels on the Meal labels screen.");

        var (nameEn, nameEs) = Meals.PlaylistNames(meal, veg.NameEn, veg.NameEs);
        var now = DateTime.UtcNow;

        var p = await db.Playlists
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.AutoVegetable == veg.Code && x.AutoMeal == meal.Key);

        if (p is null)
        {
            p = new Playlist
            {
                NameEn = nameEn,
                NameEs = nameEs,
                AutoVegetable = veg.Code,
                AutoMeal = meal.Key,
                CreatedAt = now,
                CreatedBy = adminId,
                Items = PlaylistHelpers.ToItems(refs)
            };
            db.Playlists.Add(p);
            await db.SaveChangesAsync();

            await PlaylistActivity.RecordAdminAsync(
                db, logger, PlaylistActivity.Created, p, $"Automatic, {PlaylistHelpers.Summary(p)}");
            return (p, null);
        }

        var unchanged = PlaylistHelpers.RefsOf(p).SequenceEqual(refs)
            && p.ArchivedAt is null
            && p.NameEn == nameEn
            && p.NameEs == nameEs;
        if (unchanged) return (p, null);

        db.PlaylistItems.RemoveRange(p.Items);
        p.Items.Clear();
        p.Items.AddRange(PlaylistHelpers.ToItems(refs));
        p.NameEn = nameEn;
        p.NameEs = nameEs;
        p.ArchivedAt = null;
        p.UpdatedAt = now;
        p.UpdatedBy = adminId;
        await db.SaveChangesAsync();

        await PlaylistActivity.RecordAdminAsync(
            db, logger, PlaylistActivity.Edited, p, $"Updated automatically, {PlaylistHelpers.Summary(p)}");
        return (p, null);
    }
}