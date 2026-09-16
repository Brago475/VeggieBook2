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
//   a produce photo     stock/<code>.jpg, accepted but not offered: each
//                       one duplicates its cover/<shortCode>.jpg twin
//   an extra photo      ExtraCovers below, tied to one vegetable
//   a graphic           MoreCoverImages below, the app's own artwork
//   a recipe photo      any photo of an active recipe, exactly as stored
//
// The choices come back in two lists. ForVegetable is the grid shown by
// default: this vegetable's own images, so a broccoli book opens on
// broccoli. MoreCovers is everything else usable, revealed only when the
// user asks for more, so the same images do not sit at the top of every
// vegetable's grid.
//
// Paths are only ever matched exactly against this list or the database, so
// a path like ../../etc/passwd can never be stored.
//
// Deliberately not offered:
//   the nine dreamstimelarge_*.jpg files, pending the original owner's
//     confirmation that they may be used under the folder's CC BY-SA
//     license. Do not add them before that answer arrives.
//   broccoli400.jpg, a smaller duplicate of stock/broccoli.jpg, and
//     root-vegetables.png, byte-identical to root_vegetables.png.
//   Untitled.png, Photo_on_1-11-13_at_10.19_PM.jpg, 20121231_194617.jpg and
//     annotation/1353005872361.jpg, which are personal photographs of
//     identifiable people that ended up in the assets folder.
//   Screen_Shot_2013-01-12_at_3.45.34_PM.png, a screenshot of a developer's
//     file picker showing personal folder and network names.
//   the religious images from the original app, which were never loaded
//     into this database, so no query can return them.
//   the secrets/, secretCat/ and tip/ folders, whose images belong to other
//     features: Secrets artwork, category buttons and tip illustrations.

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

    // The app's own artwork: category banners, the masthead, the Secrets
    // title card. These carry baked-in text and were built as interface
    // graphics rather than photographs, so they are offered only under
    // "more covers", never in a vegetable's default grid.
    private static readonly string[] MoreCoverImages =
    [
        "stock/asian-cooking-en.png",
        "stock/asian-cooking-es.png",
        "stock/asian_en200.gif",
        "stock/asian_en640.jpg",
        "stock/asian_es640.jpg",
        "stock/cocina-latina-en.png",
        "stock/cocina-latina-es.png",
        "stock/hispanic_en640.jpg",
        "stock/hispanic_es640.jpg",
        "stock/kid-friendly-en.png",
        "stock/kid-friendly-es.png",
        "stock/kidfriendly_en200.gif",
        "stock/kidfriendly_en640.jpg",
        "stock/kidfriendly_es640.jpg",
        "stock/masthead_en300.png",
        "stock/root_vegetables.png",
        "stock/secretsToHealthyEating.png",
        "stock/soul_food-en.png",
        "stock/soul_food-es.png",
        "stock/soulfood_en640.jpg",
        "stock/soulfood_es640.jpg",
    ];

    private static readonly Regex VegetableCover =
        new(@"^cover/([A-Z]{2})\.jpg$", RegexOptions.CultureInvariant);

    private static readonly Regex StockCover =
        new(@"^stock/([a-z]+)\.jpg$", RegexOptions.CultureInvariant);

    // The produce shot filenames are the vegetable codes lowercased:
    // BROCCOLI -> stock/broccoli.jpg. Not offered as a choice, since each
    // one is byte-identical to its cover/<shortCode>.jpg twin, but kept
    // here because books saved earlier may still hold a stock/ path.
    private static string StockFor(string vegetableCode) =>
        $"stock/{vegetableCode.ToLowerInvariant()}.jpg";

    private static string[] ExtrasFor(string vegetableCode) =>
        ExtraCovers.TryGetValue(vegetableCode, out var extras) ? extras : [];

    // The default grid: this vegetable's cover, the shared covers, any
    // extra photos of it, then its recipes' photos in recipe order.
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
            .. ExtrasFor(veg.Code),
            .. photos,
        ];
        return all.Distinct().ToList();
    }

    // Everything usable that the default grid does not already show: the
    // other vegetables' covers and extras, then the app's artwork.
    //
    // Uses cover/<shortCode>.jpg rather than the byte-identical
    // stock/<code>.jpg, so one image is never offered under two paths.
    public static async Task<List<string>> MoreCovers(VeggieBookContext db, Vegetable veg)
    {
        var others = await db.Vegetables
            .Where(v => v.Active && v.Code != veg.Code)
            .OrderBy(v => v.Code)
            .Select(v => new { v.Code, v.ShortCode })
            .ToListAsync();

        List<string> more = [];
        foreach (var other in others)
        {
            more.Add($"cover/{other.ShortCode}.jpg");
            more.AddRange(ExtrasFor(other.Code));
        }
        more.AddRange(MoreCoverImages);
        return more.Distinct().ToList();
    }

    public static async Task<bool> IsAllowed(VeggieBookContext db, string path)
    {
        if (path.Length > 300) return false;
        if (SharedCovers.Contains(path)) return true;
        if (MoreCoverImages.Contains(path)) return true;
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