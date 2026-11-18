using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Books.Print.Pages;
using VeggieBook.Api.Data;
using VeggieBook.Api.Playlists;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Books.Print;

// One playlist item to print, in playlist order.
internal sealed record PlaylistPrintItem(string Kind, int Id);

// A playlist as a PDF in the VeggieBook style: a cover with the playlist's
// title, counts and contents, one page per recipe in playlist order, then
// its tips, each named with its vegetable since a playlist mixes them.
// The cover photo is the first recipe's finished dish, else the first tip
// picture, else the first item's vegetable.

internal static class PlaylistPdf
{
    // Null when nothing in the playlist can be printed.
    public static async Task<BookPdfFile?> BuildAsync(
        VeggieBookContext content, string name, List<PlaylistPrintItem> items, bool es, string imagesRoot)
    {
        var words = BookWords.For(es);
        var recipeIds = items.Where(i => i.Kind == PlaylistKinds.Recipe).Select(i => i.Id).ToArray();
        var tipIds = items.Where(i => i.Kind == PlaylistKinds.Tip).Select(i => i.Id).ToArray();

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Select(v => new { v.Code, v.NameEn, v.NameEs, v.ImagePath })
            .ToDictionaryAsync(v => v.Code);

        string VegetableName(string? code) =>
            code is not null && vegetables.TryGetValue(code, out var v) ? (es ? v.NameEs : v.NameEn) : "";

        var recipeRows = await content.Recipes
            .AsNoTracking()
            .Where(r => recipeIds.Contains(r.Id))
            .Select(r => new
            {
                r.Id,
                r.DisplayCode,
                r.VegetableCode,
                Title = es ? r.TitleEs : r.TitleEn,
                Prep = es ? r.TimeToPrepareEs : r.TimeToPrepareEn,
                Cook = es ? r.TimeToCookEs : r.TimeToCookEn,
                Serves = es ? r.ServingsEs : r.ServingsEn,
                Ahead = es ? r.CanBeMadeAheadEs : r.CanBeMadeAheadEn,
                Frozen = es ? r.CanBeFrozenEs : r.CanBeFrozenEn,
                Leftovers = es ? r.GoodForLeftoversEs : r.GoodForLeftoversEn,
                Ingredients = r.Ingredients.OrderBy(x => x.Position)
                    .Select(x => es ? x.TextEs : x.TextEn).ToList(),
                Steps = r.Steps.OrderBy(x => x.Position)
                    .Select(x => es ? x.TextEs : x.TextEn).ToList(),
                Notes = r.Notes.OrderBy(x => x.Position)
                    .Select(x => es ? x.TextEs : x.TextEn).ToList(),
                Photos = r.Photos.OrderBy(p => p.Position)
                    .Select(p => p.ImagePath).ToList()
            })
            .ToListAsync();
        var recipeById = recipeRows.ToDictionary(r => r.Id);

        var recipes = recipeIds
            .Where(recipeById.ContainsKey)
            .Select(id =>
            {
                var r = recipeById[id];
                var photo = BookImages.Find(imagesRoot, RecipePhotos.Finished(r.Photos));
                return (Photo: photo, Sheet: new RecipeSheet(
                    BookPdf.Clean(r.Title),
                    r.DisplayCode,
                    BookPdf.Clean(r.Prep),
                    BookPdf.Clean(r.Cook),
                    BookPdf.Clean(r.Serves),
                    BookPdf.Clean(r.Ahead),
                    BookPdf.Clean(r.Frozen),
                    BookPdf.Clean(r.Leftovers),
                    CleanAll(r.Ingredients),
                    CleanAll(r.Steps),
                    CleanAll(r.Notes),
                    photo));
            })
            .ToList();

        var tipRows = await content.Tips
            .AsNoTracking()
            .Where(t => tipIds.Contains(t.Id))
            .Select(t => new
            {
                t.Id,
                t.VegetableCode,
                Heading = es ? t.HeadingEs : t.HeadingEn,
                Parts = t.Blocks.OrderBy(b => b.Position)
                    .Select(b => new { Text = es ? b.TextEs : b.TextEn, b.ImagePath })
                    .ToList()
            })
            .ToListAsync();
        var tipById = tipRows.ToDictionary(t => t.Id);

        // A picture shared by several tips prints only once.
        var shownPictures = new HashSet<string>(StringComparer.Ordinal);
        string? firstTipPicture = null;
        var tips = tipIds
            .Where(tipById.ContainsKey)
            .Select(id =>
            {
                var t = tipById[id];
                var vegetable = VegetableName(t.VegetableCode);
                var heading = BookPdf.Clean(t.Heading);
                var blocks = t.Parts.Select(p =>
                {
                    var path = BookImages.Find(imagesRoot, p.ImagePath);
                    firstTipPicture ??= path;
                    return new PrintTipBlock(BookPdf.Clean(p.Text), FirstUse(shownPictures, path));
                }).ToList();
                return new PrintTipSection(vegetable.Length > 0 ? $"{vegetable}: {heading}" : heading, blocks);
            })
            .ToList();

        if (recipes.Count == 0 && tips.Count == 0) return null;

        var coverPath = recipes.Select(r => r.Photo).FirstOrDefault(p => p is not null)
            ?? firstTipPicture
            ?? FirstVegetablePicture();

        string? FirstVegetablePicture()
        {
            var code = recipeRows.Select(r => r.VegetableCode)
                .Concat(tipRows.Select(t => t.VegetableCode))
                .FirstOrDefault(c => c is not null);
            return code is not null && vegetables.TryGetValue(code, out var v)
                ? BookImages.Find(imagesRoot, v.ImagePath)
                : null;
        }

        using var pages = new PdfPages(name);
        pages.NewPage();

        var contents = new List<ContentsLine>();
        foreach (var (_, sheet) in recipes)
            contents.Add(new ContentsLine(sheet.Title, RecipePage.Draw(pages, sheet, words)));

        ContentsLine? tipsLine = null;
        if (tips.Count > 0)
        {
            var tipsTitle = string.Format(words.TipsFor, name);
            tipsLine = new ContentsLine(tipsTitle, TipsPages.Draw(pages, tipsTitle, tips));
        }

        var counts = new List<string>();
        if (recipes.Count > 0) counts.Add(words.Count(recipes.Count, secrets: false));
        if (tips.Count > 0) counts.Add(words.Tips(tips.Count));

        var cover = pages.Reopen(1);
        CoverPage.Draw(pages, cover, es, name, string.Join(", ", counts), words.PlaylistLabel,
            null, coverPath, contents, tipsLine, words with { InThisBook = words.InThisPlaylist });

        return new BookPdfFile(pages.Finish(words, es, hasCover: true), BookPdf.FileName("Playlist", name));
    }

    private static List<string> CleanAll(List<string> lines) =>
        lines.Select(BookPdf.Clean).Where(x => x.Length > 0).ToList();

    private static string? FirstUse(HashSet<string> shown, string? path) =>
        path is not null && shown.Add(path) ? path : null;
}