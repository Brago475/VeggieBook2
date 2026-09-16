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
//   a produce photo     stock/<code>.jpg, one per vegetable
//   an extra photo      ExtraCovers below, tied to one vegetable
//   a recipe photo      any photo of an active recipe, exactly as stored
//
// The choices come back in two lists. ForVegetable is the grid shown by
// default: this vegetable's own images, so a broccoli book opens on
// broccoli. MoreCovers is everything else that is usable, revealed only
// when the user asks for more, so the same images do not sit at the top of
// every vegetable's grid.
//
// Paths are only ever matched exactly against this list or the database, so
// a path like ../../etc/passwd can never be stored.
//
// Deliberately not offered:
//   the nine dreamstimelarge_*.jpg files, pending the original owner's
//     confirmation that they may be used under the folder's CC BY-SA
//     license. Do not add them before that answer arrives.
//   interface graphics (masthead, kid-friendly, asian, soul_food, hispanic,
//     cocina-latina, secretsToHealthyEating, root-vegetables), which carry
//     baked-in text and are app chrome, not photographs.
//   broccoli400.jpg, a smaller duplicate of stock/broccoli.jpg.
//   Untitled.png, Photo_on_1-11-13_at_10.19_PM.jpg and 20121231_194617.jpg,
//     which are personal photographs of identifiable people that ended up
//     in the assets folder. They are not app content and must never be
//     offered as covers.
//   the religious images from the original app, which were never loaded
//     into this database, so no query can return them.

public static class CoverCatalog
{
    // The produce basket (cornucopia.jpg) goes here once the owner sends it.
    public static readonly string[] SharedCovers = [];

    // Photos in the stock folder that belong to one vegetable but are not
    // its main produce shot. Keyed by vegetable code.
    private static readonly Dictionary<string, string[]> ExtraCovers = new()
    {
        ["CABBAGE"] = ["stock/CabbageWedges.jpg", "stock/CabbageWedges-prep.jpg"],
    };

    private static readonly Regex VegetableCover =
        new(@"^cover/([A-Z]{2})\.jpg$", RegexOptions.CultureInvariant);

    private static readonly Regex StockCover =
        new(@"^stock/([a-z]+)\.jpg$", RegexOptions.CultureInvariant);

    // The produce shot filenames are the vegetable codes lowercased:
    // BROCCOLI -> stock/broccoli.jpg.
    private static string StockFor(string vegetableCode) =>
        $"stock/{vegetableCode.ToLowerInvariant()}.jpg";

    private static string[] ExtrasFor(string vegetableCode) =>
        ExtraCovers.TryGetValue(vegetableCode, out var extras) ? extras : [];

    // The default grid: this vegetable's cover, the shared covers, its own
    // produce shot, any extra photos of it, then its recipes' photos in
    // recipe order.
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

        List<string> all =
        [
            $"cover/{veg.ShortCode}.jpg",
            .. SharedCovers,
            StockFor(veg.Code),
            .. ExtrasFor(veg.Code),
            .. photos,
        ];
        return all.Distinct().ToList();
    }

    // Everything usable that the default grid does not already show: the
    // other vegetables' produce shots and their extra photos.
    public static async Task<List<string>> MoreCovers(VeggieBookContext db, Vegetable veg)
    {
        var codes = await db.Vegetables
            .Where(v => v.Active && v.Code != veg.Code)
            .OrderBy(v => v.Code)
            .Select(v => v.Code)
            .ToListAsync();

        List<string> more = [];
        foreach (var code in codes)
        {
            more.Add(StockFor(code));
            more.AddRange(ExtrasFor(code));
        }
        return more.Distinct().ToList();
    }

    public static async Task<bool> IsAllowed(VeggieBookContext db, string path)
    {
        if (path.Length > 300) return false;
        if (SharedCovers.Contains(path)) return true;
        if (ExtraCovers.Values.Any(list => list.Contains(path))) return true;

        var vegMatch = VegetableCover.Match(path);
        if (vegMatch.Success)
        {
            var shortCode = vegMatch.Groups[1].Value;
            return await db.Vegetables.AnyAsync(v => v.ShortCode == shortCode && v.Active);
        }

        // A produce shot is allowed if it belongs to an active vegetable,
        // whichever vegetable's book it is used on.
        var stockMatch = StockCover.Match(path);
        if (stockMatch.Success)
        {
            var code = stockMatch.Groups[1].Value.ToUpperInvariant();
            return await db.Vegetables.AnyAsync(v => v.Code == code && v.Active);
        }

        return await db.RecipePhotos.AnyAsync(p =>
            p.ImagePath == path && db.Recipes.Any(r => r.Id == p.RecipeId && r.Active));
    }
}