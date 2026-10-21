using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using MigraDoc.DocumentObjectModel;
using MigraDoc.DocumentObjectModel.Tables;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books.Print;

// A VeggieBook as a PDF, in one of three forms:
//   the whole book     the cover, one page per kept recipe, then the
//                      vegetable's tips that match the book's answers
//   one recipe         just that recipe's page
//   extra copies       just the recipes picked for extra copies, each
//                      printed as many times as picked, with no cover
// Recipes run in the same order as the book viewer.
// Every recipe page uses the same fixed header, photo frame and facts row;
// only the content below the facts row changes length.

internal static class VeggieBookPdf
{
    // Header area in cm: room for a two-line title and the story line.
    private const double HeaderHeight = 2.28;
    private const double CodeWidth = 2.4;
    private const double TitleSize = 18;
    private const double ListIndent = 0.55;

    private static readonly Regex PrepShot = new(@"prep\d*", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private sealed record RecipePage(
        int Id,
        string? Code,
        string Title,
        string Story,
        string Prep,
        string Cook,
        string Serves,
        string Ahead,
        string Frozen,
        string Leftovers,
        List<string> Ingredients,
        List<string> Steps,
        List<string> Notes,
        string? Photo);

    private sealed record TipPart(string Text, string? Image);

    private sealed record TipPage(string Heading, List<TipPart> Parts);

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
                Story = es ? r.StoryLineEs : r.StoryLineEn,
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
            .Select(r => new RecipePage(
                r.Id, r.DisplayCode, r.Title, r.Story ?? "", r.Prep, r.Cook, r.Serves,
                r.Ahead, r.Frozen, r.Leftovers, r.Ingredients, r.Steps, r.Notes, FinishedPhoto(r.Photos)))
            .OrderBy(r => r.Code == null)
            .ThenBy(r => r.Code)
            .ThenBy(r => r.Id)
            .ToList();
        if (recipes.Count == 0) return null;

        if (only is not null)
        {
            var single = recipes[0];
            var title = BookPdf.Clean(single.Title);
            var (one, page) = BookPdf.Start(title, words);
            AddRecipe(page, single, words, imagesRoot);
            return new BookPdfFile(BookPdf.Render(one, es), BookPdf.FileName("Recipe", title));
        }

        var veg = await content.Vegetables
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Code == book.VegetableCode);
        var name = veg is null ? "VeggieBook" : es ? veg.NameEs : veg.NameEn;

        if (extras)
        {
            var copies = book.Items.ToDictionary(i => i.Id, i => i.ExtraCopies);
            var (extra, pages) = BookPdf.Start($"VeggieBook: {name}", words);
            var first = true;
            foreach (var recipe in recipes)
            {
                for (var c = 0; c < copies.GetValueOrDefault(recipe.Id); c++)
                {
                    if (!first) pages.AddPageBreak();
                    AddRecipe(pages, recipe, words, imagesRoot);
                    first = false;
                }
            }
            return new BookPdfFile(BookPdf.Render(extra, es), BookPdf.FileName("Extra-Copies", name));
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
            .Select(t => new TipPage(t.Heading, t.Parts.Select(p => new TipPart(p.Text, p.ImagePath)).ToList()))
            .ToList();

        var cover = BookPdf.FromBytes(book.Upload)
            ?? BookPdf.FromFile(BookImages.Find(imagesRoot, book.CoverPath));

        var (doc, section) = BookPdf.Start($"VeggieBook: {name}", words);
        BookPdf.AddCover(section, es, cover, name,
            $"{words.Count(recipes.Count, secrets: false)}, {words.MadeOn(book.CreatedAt)}");

        foreach (var recipe in recipes)
        {
            section.AddPageBreak();
            AddRecipe(section, recipe, words, imagesRoot);
        }

        if (tips.Count > 0)
        {
            section.AddPageBreak();
            AddTips(section, tips, string.Format(words.TipsFor, name), imagesRoot);
        }

        return new BookPdfFile(BookPdf.Render(doc, es, hasCover: true), BookPdf.FileName("VeggieBook", name));
    }

    // The finished dish: the last photo not named as a prep shot, else the last photo.
    private static string? FinishedPhoto(List<string> photos)
    {
        if (photos.Count == 0) return null;
        var finished = photos.LastOrDefault(p => !PrepShot.IsMatch(p));
        return finished ?? photos[^1];
    }

    private static void AddRecipe(Section section, RecipePage r, BookWords words, string imagesRoot)
    {
        AddHeader(section, r);
        BookPdf.PhotoFrame(section, BookPdf.FromFile(BookImages.Find(imagesRoot, r.Photo)));
        BookPdf.Spacer(section, 0.35);

        AddFacts(section, words, r);
        AddIngredients(section, words.Ingredients, r.Ingredients);
        AddSteps(section, words.Directions, r.Steps);

        var good = r.Notes.Select(BookPdf.Clean).Where(x => x.Length > 0).ToList();
        AddLabeled(good, words.MadeAhead, r.Ahead);
        AddLabeled(good, words.Frozen, r.Frozen);
        AddLabeled(good, words.Leftovers, r.Leftovers);
        if (good.Count == 0) return;

        BookPdf.Spacer(section, 0.35);
        var cell = BookPdf.Box(section);
        var h = cell.AddParagraph(words.GoodToKnow);
        h.Format.Font.Bold = true;
        h.Format.Font.Color = BookPdf.Green;
        h.Format.SpaceAfter = Unit.FromPoint(3);
        foreach (var line in good)
        {
            var p = cell.AddParagraph();
            p.Format.Font.Size = 10;
            p.Format.SpaceAfter = Unit.FromPoint(2);
            BookPdf.AddRich(p, line);
        }
    }

    // Fixed-height header: title (up to two lines) with the story line under it, code at the top right.
    private static void AddHeader(Section section, RecipePage r)
    {
        var table = section.AddTable();
        table.LeftPadding = Unit.FromPoint(0);
        table.RightPadding = Unit.FromPoint(0);
        table.TopPadding = Unit.FromPoint(0);
        table.BottomPadding = Unit.FromPoint(0);
        table.AddColumn(Unit.FromCentimeter(BookPdf.UsableWidth - CodeWidth));
        table.AddColumn(Unit.FromCentimeter(CodeWidth));

        var row = table.AddRow();
        row.Height = Unit.FromCentimeter(HeaderHeight);
        row.HeightRule = RowHeightRule.Exactly;
        row.VerticalAlignment = VerticalAlignment.Top;

        var main = row.Cells[0];
        var title = main.AddParagraph(BookPdf.Clean(r.Title));
        title.Format.Font.Size = TitleSize;
        title.Format.Font.Bold = true;
        title.Format.LineSpacingRule = LineSpacingRule.Exactly;
        title.Format.LineSpacing = Unit.FromPoint(22);

        var story = BookPdf.Clean(r.Story);
        if (story.Length > 0)
        {
            var p = main.AddParagraph();
            p.Format.Font.Size = 10;
            p.Format.Font.Color = BookPdf.Muted;
            p.Format.SpaceBefore = Unit.FromPoint(2);
            BookPdf.AddRich(p, story);
        }

        if (!string.IsNullOrEmpty(r.Code))
        {
            var c = row.Cells[1].AddParagraph(r.Code);
            c.Format.Alignment = ParagraphAlignment.Right;
            c.Format.SpaceBefore = Unit.FromPoint(6);
            c.Format.Font.Size = 9;
            c.Format.Font.Bold = true;
            c.Format.Font.Color = BookPdf.Muted;
        }
    }

    // Prep, cook, and serves as one outlined row split in three.
    private static void AddFacts(Section section, BookWords words, RecipePage r)
    {
        var facts = new[] { (words.Prep, r.Prep), (words.Cook, r.Cook), (words.Serves, r.Serves) };
        if (facts.All(f => string.IsNullOrWhiteSpace(f.Item2))) return;

        var table = section.AddTable();
        table.Borders.Width = 0.75;
        table.Borders.Color = BookPdf.Line;
        table.LeftPadding = Unit.FromCentimeter(0.3);
        table.RightPadding = Unit.FromCentimeter(0.3);
        table.TopPadding = Unit.FromCentimeter(0.2);
        table.BottomPadding = Unit.FromCentimeter(0.2);
        foreach (var _ in facts) table.AddColumn(Unit.FromCentimeter(BookPdf.UsableWidth / facts.Length));

        var row = table.AddRow();
        for (var i = 0; i < facts.Length; i++)
        {
            var cell = row.Cells[i];
            var label = cell.AddParagraph(facts[i].Item1);
            label.Format.Font.Size = 8;
            label.Format.Font.Bold = true;
            label.Format.Font.Color = BookPdf.Muted;
            var value = cell.AddParagraph(BookPdf.Clean(facts[i].Item2));
            value.Format.Font.Size = 12;
            value.Format.Font.Bold = true;
        }
    }

    private static void AddIngredients(Section section, string heading, List<string> lines)
    {
        var items = lines.Select(BookPdf.Clean).Where(x => x.Length > 0).ToList();
        if (items.Count == 0) return;

        ListHeading(section, heading);
        foreach (var line in items)
        {
            var p = section.AddParagraph();
            p.Format.SpaceAfter = Unit.FromPoint(2);

            if (IsSubheading(line))
            {
                p.Format.SpaceBefore = Unit.FromPoint(3);
                p.Format.Font.Bold = true;
                p.Format.KeepWithNext = true;
                BookPdf.AddRich(p, line);
                continue;
            }

            Hang(p);
            p.AddText("•");
            p.AddTab();
            BookPdf.AddRich(p, line);
        }
    }

    private static void AddSteps(Section section, string heading, List<string> lines)
    {
        var items = lines.Select(BookPdf.Clean).Where(x => x.Length > 0).ToList();
        if (items.Count == 0) return;

        ListHeading(section, heading);
        for (var i = 0; i < items.Count; i++)
        {
            var p = section.AddParagraph();
            p.Format.SpaceAfter = Unit.FromPoint(2);
            Hang(p);
            p.AddText($"{i + 1}.");
            p.AddTab();
            BookPdf.AddRich(p, items[i]);
        }
    }

    private static void ListHeading(Section section, string text)
    {
        var h = BookPdf.Heading(section, text, 14, green: true);
        h.Format.SpaceBefore = Unit.FromPoint(9);
        h.Format.SpaceAfter = Unit.FromPoint(4);
    }

    // Marker at the margin, text on a tab stop, wrapped lines aligned under the text.
    private static void Hang(Paragraph p)
    {
        p.Format.LeftIndent = Unit.FromCentimeter(ListIndent);
        p.Format.FirstLineIndent = Unit.FromCentimeter(-ListIndent);
        p.Format.AddTabStop(Unit.FromCentimeter(ListIndent));
    }

    // Short lines ending in a colon, such as "Dressing:", label a group of ingredients.
    private static bool IsSubheading(string line) => line.EndsWith(':') && line.Length <= 40;

    private static void AddLabeled(List<string> lines, string label, string value)
    {
        var text = BookPdf.Clean(value);
        if (text.Length > 0) lines.Add($"{label}: {text}");
    }

    private static void AddTips(Section section, List<TipPage> tips, string heading, string imagesRoot)
    {
        var top = BookPdf.Heading(section, heading, 22);
        top.Format.SpaceAfter = Unit.FromPoint(8);

        foreach (var tip in tips)
        {
            var h = BookPdf.Heading(section, BookPdf.Clean(tip.Heading), 14, green: true);
            h.Format.SpaceBefore = Unit.FromPoint(12);
            h.Format.SpaceAfter = Unit.FromPoint(4);

            foreach (var part in tip.Parts)
            {
                var text = BookPdf.Clean(part.Text);
                if (text.Length > 0)
                {
                    var p = section.AddParagraph();
                    p.Format.SpaceAfter = Unit.FromPoint(4);
                    BookPdf.AddRich(p, text);
                }
                BookPdf.Picture(section, BookPdf.FromFile(BookImages.Find(imagesRoot, part.Image)), 8, 6);
            }
        }
    }
}