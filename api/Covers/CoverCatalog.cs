using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Covers;

// Which images can be a book's cover. One catalog, used both to list the
// choices (CoversController) and to check a saved book's cover
// (BooksController), so the two can never disagree.
//
// A cover is one of:
//   a vegetable cover   cover/BR.jpg, one per active vegetable
//   a shared cover      SharedCovers below, offered with every vegetable
//   a recipe photo      any photo of an active recipe, exactly as stored
//
// Paths are only ever matched exactly against this list or the database, so
// a path like ../../etc/passwd can never be stored.
//
// The religious images from the original app are not here. They were never
// loaded into this database, so no query can return them.

public static class CoverCatalog
{
    // The produce basket (cornucopia.jpg) goes here once the owner sends it.
    public static readonly string[] SharedCovers = [];

    private static readonly Regex VegetableCover =
        new(@"^cover/([A-Z]{2})\.jpg$", RegexOptions.CultureInvariant);

    // Every cover offered while browsing one vegetable: its own cover, the
    // shared covers, then its recipes' photos in recipe order.
    public static async Task<List<string>> ForVegetable(VeggieBookContext db, Vegetable veg)
    {
        var photos = await db.RecipePhotos
            .Join(db.Recipes, p => p.RecipeId, r => r.Id, (p, r) => new { p, r })
            .Where(x => x.r.VegetableCode == veg.Code && x.r.Active)
            .OrderBy(x => x.r.DisplayCode == null)
            .ThenBy(x => x.r.DisplayCode)
            .ThenBy(x => x.r.Id)
            .ThenBy(x => x.p.Position)
            .Select(x => x.p.ImagePath)
            .ToListAsync();

        List<string> all = [$"cover/{veg.ShortCode}.jpg", .. SharedCovers, .. photos];
        return all.Distinct().ToList();
    }

    public static async Task<bool> IsAllowed(VeggieBookContext db, string path)
    {
        if (path.Length > 300) return false;
        if (SharedCovers.Contains(path)) return true;

        var match = VegetableCover.Match(path);
        if (match.Success)
        {
            var shortCode = match.Groups[1].Value;
            return await db.Vegetables.AnyAsync(v => v.ShortCode == shortCode && v.Active);
        }

        return await db.RecipePhotos.AnyAsync(p =>
            p.ImagePath == path && db.Recipes.Any(r => r.Id == p.RecipeId && r.Active));
    }
}