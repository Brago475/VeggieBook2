using Microsoft.EntityFrameworkCore;
using MigraDoc.DocumentObjectModel;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books.Print;

// A VeggieBook as a PDF: the cover, one page per kept recipe (printed again
// for each extra copy), then the vegetable's tips that match the book's
// answers. Recipes run in the same order as the book viewer.

internal static class VeggieBookPdf
{
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

    public static async Task<BookPdfFile> BuildAsync(
        VeggieBookContext content, BookPrint book, bool es, string imagesRoot)
    {
        var words = BookWords.For(es);

        var veg = await content.Vegetables
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Code == book.VegetableCode);
        var name = veg is null ? "VeggieBook" : es ? veg.NameEs : veg.NameEn;

        var ids = book.Items.Select(i => i.Id).ToArray();
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
                Photo = r.Photos.OrderBy(p => p.Position)
                    .Select(p => p.ImagePath).FirstOrDefault()
            })
            .ToListAsync();

        var recipes = rows
            .Select(r => new RecipePage(
                r.Id, r.DisplayCode, r.Title, r.Story ?? "", r.Prep, r.Cook, r.Serves,
                r.Ahead, r.Frozen, r.Leftovers, r.Ingredients, r.Steps, r.Notes, r.Photo))
            .OrderBy(r => r.Code == null)
            .ThenBy(r => r.Code)
            .ThenBy(r => r.Id)
            .ToList();

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

        var extras = book.Items.ToDictionary(i => i.Id, i => i.ExtraCopies);
        var cover = BookPdf.FromBytes(book.Upload)
            ?? BookPdf.FromFile(BookImages.Find(imagesRoot, book.CoverPath));

        var (doc, section) = BookPdf.Start($"VeggieBook: {name}", words);
        BookPdf.AddCover(section, es, cover, name,
            $"{words.Count(recipes.Count, secrets: false)}, {words.MadeOn(book.CreatedAt)}");

        foreach (var recipe in recipes)
        {
            var copies = 1 + extras.GetValueOrDefault(recipe.Id);
            for (var c = 0; c < copies; c++)
            {
                section.AddPageBreak();
                AddRecipe(section, recipe, words, imagesRoot);
            }
        }

        if (tips.Count > 0)
        {
            section.AddPageBreak();
            AddTips(section, tips, string.Format(words.TipsFor, name), imagesRoot);
        }

        return new BookPdfFile(BookPdf.Render(doc, es), BookPdf.FileName("VeggieBook", name));
    }

    private static void AddRecipe(Section section, RecipePage r, BookWords words, string imagesRoot)
    {
        var head = section.AddParagraph();
        head.Format.AddTabStop(Unit.FromCentimeter(BookPdf.UsableWidth), TabAlignment.Right);
        head.Format.SpaceAfter = Unit.FromPoint(4);
        head.Format.KeepWithNext = true;
        var title = head.AddFormattedText(BookPdf.Clean(r.Title));
        title.Size = 20;
        title.Bold = true;
        if (!string.IsNullOrEmpty(r.Code))
        {
            head.AddTab();
            var code = head.AddFormattedText(r.Code);
            code.Size = 9;
            code.Bold = true;
            code.Color = BookPdf.Muted;
        }

        var story = BookPdf.Clean(r.Story);
        if (story.Length > 0)
        {
            var p = section.AddParagraph(story);
            p.Format.Font.Color = BookPdf.Muted;
            p.Format.SpaceAfter = Unit.FromPoint(6);
        }

        BookPdf.Picture(section, BookPdf.FromFile(BookImages.Find(imagesRoot, r.Photo)), BookPdf.UsableWidth, 8.5);

        AddFacts(section, words, r);

        AddList(section, words.Ingredients, r.Ingredients.Select(BookPdf.Clean).Select(x => "• " + x));
        AddList(section, words.Directions, r.Steps.Select(BookPdf.Clean).Select((x, i) => $"{i + 1}. {x}"));

        var good = r.Notes.Select(BookPdf.Clean).Where(x => x.Length > 0).ToList();
        AddLabeled(good, words.MadeAhead, r.Ahead);
        AddLabeled(good, words.Frozen, r.Frozen);
        AddLabeled(good, words.Leftovers, r.Leftovers);
        if (good.Count > 0)
        {
            section.AddParagraph().Format.SpaceAfter = Unit.FromPoint(4);
            var cell = BookPdf.Box(section);
            var h = cell.AddParagraph(words.GoodToKnow);
            h.Format.Font.Bold = true;
            h.Format.Font.Color = BookPdf.Green;
            h.Format.SpaceAfter = Unit.FromPoint(3);
            foreach (var line in good)
            {
                var p = cell.AddParagraph(line);
                p.Format.Font.Size = 10;
                p.Format.SpaceAfter = Unit.FromPoint(2);
            }
        }
    }

    // Prep, cook, and serves as three shaded boxes in a row.
    private static void AddFacts(Section section, BookWords words, RecipePage r)
    {
        var facts = new[] { (words.Prep, r.Prep), (words.Cook, r.Cook), (words.Serves, r.Serves) };
        if (facts.All(f => string.IsNullOrWhiteSpace(f.Item2))) return;

        var table = section.AddTable();
        table.Borders.Color = Colors.White;
        table.Borders.Width = 4;
        table.LeftPadding = Unit.FromCentimeter(0.3);
        table.TopPadding = Unit.FromCentimeter(0.2);
        table.BottomPadding = Unit.FromCentimeter(0.2);
        foreach (var _ in facts) table.AddColumn(Unit.FromCentimeter(BookPdf.UsableWidth / facts.Length));

        var row = table.AddRow();
        for (var i = 0; i < facts.Length; i++)
        {
            var cell = row.Cells[i];
            cell.Shading.Color = BookPdf.Fill;
            var label = cell.AddParagraph(facts[i].Item1);
            label.Format.Font.Size = 8;
            label.Format.Font.Bold = true;
            label.Format.Font.Color = BookPdf.Muted;
            var value = cell.AddParagraph(BookPdf.Clean(facts[i].Item2));
            value.Format.Font.Size = 12;
            value.Format.Font.Bold = true;
        }
    }

    private static void AddList(Section section, string heading, IEnumerable<string> lines)
    {
        var items = lines.Where(x => x.Length > 3).ToList();
        if (items.Count == 0) return;

        var h = BookPdf.Heading(section, heading, 14, green: true);
        h.Format.SpaceBefore = Unit.FromPoint(12);
        h.Format.SpaceAfter = Unit.FromPoint(4);
        foreach (var line in items)
        {
            var p = section.AddParagraph(line);
            p.Format.SpaceAfter = Unit.FromPoint(3);
            p.Format.LeftIndent = Unit.FromCentimeter(0.4);
            p.Format.FirstLineIndent = Unit.FromCentimeter(-0.4);
        }
    }

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
                    var p = section.AddParagraph(text);
                    p.Format.SpaceAfter = Unit.FromPoint(4);
                }
                BookPdf.Picture(section, BookPdf.FromFile(BookImages.Find(imagesRoot, part.Image)), 8, 6);
            }
        }
    }
}