using Microsoft.EntityFrameworkCore;
using Npgsql;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Playlists;

// Automatic playlists: every tip and recipe with one meal label for one
// vegetable. Tips come first, then recipes, in code order. One playlist per
// vegetable and meal; sending it again refreshes its items and restores it
// if it was archived.
//
// Two admins making the same automatic playlist at once: the database keeps
// one (playlist_auto_unique, 026) and the slower request uses that one.

public static class AutoPlaylists
{
    private const string UniqueIndex = "playlist_auto_unique";

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

        var p = await FindAsync(db, veg.Code, meal.Key);

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

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (IsDuplicate(ex))
            {
                // Another admin made it a moment ago; use theirs.
                Detach(db, p);
                var theirs = await FindAsync(db, veg.Code, meal.Key);
                return theirs is null
                    ? (null, "The playlist could not be made. Please try again.")
                    : (theirs, null);
            }

            await PlaylistActivity.RecordAdminAsync(
                db, logger, PlaylistActivity.Created, p, $"Automatic, {PlaylistHelpers.Summary(p)}", adminId);
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

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another admin refreshed it at the same moment with the same labels.
            Detach(db, p);
            var latest = await FindAsync(db, veg.Code, meal.Key);
            return latest is null
                ? (null, "The playlist could not be updated. Please try again.")
                : (latest, null);
        }

        await PlaylistActivity.RecordAdminAsync(
            db, logger, PlaylistActivity.Edited, p, $"Updated automatically, {PlaylistHelpers.Summary(p)}", adminId);
        return (p, null);
    }

    private static Task<Playlist?> FindAsync(AccountsContext db, string vegetable, string meal) =>
        db.Playlists
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.AutoVegetable == vegetable && x.AutoMeal == meal);

    private static bool IsDuplicate(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } pg
        && pg.ConstraintName == UniqueIndex;

    // Drops the failed playlist and its items from the context, so later
    // saves in the same request don't try them again.
    private static void Detach(AccountsContext db, Playlist p)
    {
        foreach (var entry in db.ChangeTracker.Entries<PlaylistItem>().Where(e => e.Entity.PlaylistId == p.Id || p.Items.Contains(e.Entity)).ToList())
            entry.State = EntityState.Detached;
        db.Entry(p).State = EntityState.Detached;
    }
}