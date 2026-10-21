using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Books.Print.Pages;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books.Print;

// A VeggieBook as a PDF, in one of three forms:
//   the whole book     the cover with its contents, one recipe per page,
//                      then the vegetable's tips that match the book's answers
//   one recipe         just that recipe
//   extra copies       just the recipes picked for extra copies, each
//                      printed as many times as picked, with no cover
// Recipes run in the same order as the book viewer. Pages are drawn by
// the classes in Pages/.

internal static class VeggieBookPdf
{
    private static readonly Regex PrepShot = new(@"prep\d*", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Null when the book has no such recipe, or no extra copies.
    public static async Task<BookPdfFile?> BuildAsync(
        VeggieBookContext content, BookPrint book, bool es, string imagesRoot,
        int? only = null, bool extras = false)
    {
        var words = BookWords.For(es);

        var ids = book.Items
            .Where(i => (only is null || i.Id == only) && (!extras || i.ExtraCopies > 0))
            .Select(i => i.Id)
            .ToArray();
        if (ids.Length == 0) return null;

        var rows = await content.Recipes
            .AsNoTracking()
            .Where(r => ids.Contains(r.Id))
            .Select(r => new
            {
                r.Id,
                r.DisplayCode,
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

        var recipes = rows
            .OrderBy(r => r.DisplayCode == null)
            .ThenBy(r => r.DisplayCode)
            .ThenBy(r => r.Id)
            .Select(r => (r.Id, Sheet: new RecipeSheet(
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
                BookImages.Find(imagesRoot, FinishedPhoto(r.Photos)))))
            .ToList();
        if (recipes.Count == 0) return null;

        if (only is not null)
        {
            var single = recipes[0].Sheet;
            using var one = new PdfPages(single.Title);
            RecipePage.Draw(one, single, words);
            return new BookPdfFile(one.Finish(words, es, hasCover: false), BookPdf.FileName("Recipe", single.Title));
        }

        var veg = await content.Vegetables
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Code == book.VegetableCode);
        var name = veg is null ? "VeggieBook" : es ? veg.NameEs : veg.NameEn;

        if (extras)
        {
            var copies = book.Items.ToDictionary(i => i.Id, i => i.ExtraCopies);
            using var extra = new PdfPages($"VeggieBook: {name}");
            foreach (var (id, sheet) in recipes)
            {
                for (var c = 0; c < copies.GetValueOrDefault(id); c++)
                    RecipePage.Draw(extra, sheet, words);
            }
            return new BookPdfFile(extra.Finish(words, es, hasCover: false), BookPdf.FileName("Extra-Copies", name));
        }

        var attributes = book.Attributes;
        var tipRows = await content.Tips
            .AsNoTracking()
            .Where(t => t.VegetableCode == book.VegetableCode && attributes.Contains(t.Attribute))
            .OrderBy(t => t.SortOrder)
            .Select(t => new
            {
                Heading = es ? t.HeadingEs : t.HeadingEn,
                Parts = t.Blocks.OrderBy(b => b.Position)
                    .Select(b => new { Text = es ? b.TextEs : b.TextEn, b.ImagePath })
                    .ToList()
            })
            .ToListAsync();
        var tips = tipRows
            .Select(t => new PrintTipSection(
                BookPdf.Clean(t.Heading),
                t.Parts.Select(p => new PrintTipBlock(BookPdf.Clean(p.Text), BookImages.Find(imagesRoot, p.ImagePath))).ToList()))
            .ToList();

        using var pages = new PdfPages($"VeggieBook: {name}");
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

        var cover = pages.Reopen(1);
        CoverPage.Draw(pages, cover, es, name,
            words.Count(recipes.Count, secrets: false), words.MadeOnLabel(book.CreatedAt),
            book.Upload, BookImages.Find(imagesRoot, book.CoverPath), contents, tipsLine, words);

        return new BookPdfFile(pages.Finish(words, es, hasCover: true), BookPdf.FileName("VeggieBook", name));
    }

    private static List<string> CleanAll(List<string> lines) =>
        lines.Select(BookPdf.Clean).Where(x => x.Length > 0).ToList();

    // The finished dish: the last photo not named as a prep shot, else the last photo.
    private static string? FinishedPhoto(List<string> photos)
    {
        if (photos.Count == 0) return null;
        return photos.LastOrDefault(p => !PrepShot.IsMatch(p)) ?? photos[^1];
    }
}