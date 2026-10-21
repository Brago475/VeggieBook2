using PdfSharp.Drawing;

namespace VeggieBook.Api.Books.Print.Pages;

// One recipe, ready to draw. Text is already cleaned of markup; PhotoPath is
// a checked file path or null.
internal sealed record RecipeSheet(
    string Title,
    string? Code,
    string Prep,
    string Cook,
    string Serves,
    string Ahead,
    string Frozen,
    string Leftovers,
    List<string> Ingredients,
    List<string> Steps,
    List<string> Notes,
    string? PhotoPath);

// Draws one recipe. Title, photo, facts bar and Good to know sit at the same
// place on every page; Ingredients and Directions fill the space between and
// continue on a new page when a recipe is too long. Good to know is pinned
// above the footer of the recipe's last page.
internal static class RecipePage
{
    private const double TitleSize = 24;
    private const double TitleMinSize = 16;
    private const double PhotoTop = 100;
    private const double PhotoWidth = 495;
    private const double PhotoHeight = 190;
    private const double FactsTop = 300;
    private const double FactsHeight = 44;
    private const double FlowTop = 354;
    private const double CardGap = 10;
    private const double GoodGap = 8;

    private const double BulletX = PageStyle.Left + 22;
    private const double IngredientX = PageStyle.Left + 34;
    private const double IngredientWidth = PageStyle.ContentWidth - 34 - 16;
    private const double StepX = PageStyle.Left + 44;
    private const double StepWidth = PageStyle.ContentWidth - 44 - 14;

    // Draws the recipe from a new page and returns that page's number.
    public static int Draw(PdfPages pages, RecipeSheet r, BookWords words)
    {
        var g = pages.NewPage();
        var firstPage = pages.PageNumber;

        DrawHeader(g, r);
        var photo = pages.Keep(PhotoCrop.Fill(r.PhotoPath, null, PhotoWidth - 8, PhotoHeight - 8));
        Shapes.Photo(g, photo, new XRect((PageStyle.PageWidth - PhotoWidth) / 2, PhotoTop, PhotoWidth, PhotoHeight));
        DrawFacts(g, r, words);

        var good = GoodItems(r, words);
        var goodHeight = GoodHeight(g, good, r.Notes);
        var limit = PageStyle.FooterTop - GoodGap - goodHeight - CardGap;

        var ingredients = r.Ingredients.Where(x => x.Length > 0).ToList();
        var steps = r.Steps.Where(x => x.Length > 0).ToList();

        var y = FlowTop;
        y = Card(pages, ref g, words.Ingredients, words, ingredients.Count,
            (gfx, i) => IngredientHeight(gfx, ingredients[i]),
            (gfx, i, top) => DrawIngredient(gfx, ingredients[i], top),
            PageStyle.CardFill, y, limit);
        Card(pages, ref g, words.Directions, words, steps.Count,
            (gfx, i) => StepHeight(gfx, steps[i]),
            (gfx, i, top) => DrawStep(gfx, i, steps[i], top),
            XColors.White, y, limit);

        if (goodHeight > 0)
            DrawGood(g, good, r.Notes, words, PageStyle.FooterTop - GoodGap - goodHeight, goodHeight);

        return firstPage;
    }

    private static void DrawHeader(XGraphics g, RecipeSheet r)
    {
        var codeWidth = string.IsNullOrEmpty(r.Code) ? 0 : Shapes.PillWidth(g, r.Code, 9) + 14;
        var width = PageStyle.ContentWidth - codeWidth;

        // Fixed size; only titles longer than two lines get smaller.
        var size = TitleSize;
        while (size > TitleMinSize && TextLayout.Wrap(g, r.Title, size, width, true).Count > 2) size -= 1;

        var height = TextLayout.Draw(g, r.Title, size, size * 1.17, PageStyle.Left, PageStyle.Top,
            width, PageStyle.Ink, bold: true);
        Shapes.Underline(g, PageStyle.Left, PageStyle.Top + height + 4, 78);

        if (!string.IsNullOrEmpty(r.Code))
            Shapes.Pill(g, r.Code, 9, PageStyle.Right - Shapes.PillWidth(g, r.Code, 9), PageStyle.Top + 4);
    }

    private static void DrawFacts(XGraphics g, RecipeSheet r, BookWords words)
    {
        g.DrawRoundedRectangle(new XSolidBrush(PageStyle.Facts),
            new XRect(PageStyle.Left, FactsTop, PageStyle.ContentWidth, FactsHeight), new XSize(15, 15));

        var facts = new[]
        {
            (FactIcon.Clock, words.Prep, r.Prep),
            (FactIcon.Pot, words.Cook, r.Cook),
            (FactIcon.Utensils, words.Serves, r.Serves)
        };
        var columnWidth = PageStyle.ContentWidth / facts.Length;
        var cy = FactsTop + FactsHeight / 2;
        var divider = new XPen(PageStyle.Divider, 0.75);

        for (var i = 0; i < facts.Length; i++)
        {
            var (icon, label, value) = facts[i];
            var x = PageStyle.Left + i * columnWidth;
            if (i > 0) g.DrawLine(divider, x, FactsTop + 9, x, FactsTop + FactsHeight - 9);

            var cx = x + 27;
            Shapes.IconCircle(g, icon, cx, cy, 13);

            var textX = cx + 22;
            var textWidth = x + columnWidth - 8 - textX;
            g.DrawString(label, PageStyle.Font(8, true), new XSolidBrush(PageStyle.Label),
                textX, cy - 13, XStringFormats.TopLeft);

            var size = 12.5;
            while (size > 9 && TextLayout.Width(g, value, size, true) > textWidth) size -= 0.5;
            g.DrawString(value, PageStyle.Font(size, true), new XSolidBrush(PageStyle.Ink),
                textX, cy - 1.5, XStringFormats.TopLeft);
        }
    }

    // Draws rows inside a tabbed card from y. When the next row does not fit
    // above limit, the card closes and continues on a new page. Returns the y
    // below the card.
    private static double Card(
        PdfPages pages, ref XGraphics g, string label, BookWords words, int count,
        Func<XGraphics, int, double> measure, Action<XGraphics, int, double> draw,
        XColor fill, double y, double limit)
    {
        var next = 0;
        var continued = false;

        while (next < count)
        {
            var contentTop = y + Shapes.CardContentTop;
            var bottom = contentTop;
            var end = next;
            while (end < count && bottom + measure(g, end) + Shapes.CardPaddingBottom <= limit)
            {
                bottom += measure(g, end);
                end++;
            }

            if (end == next)
            {
                if (y > PageStyle.Top)
                {
                    g = pages.NewPage();
                    y = PageStyle.Top;
                    continued = true;
                    continue;
                }
                // A single row taller than the space prints anyway.
                bottom += measure(g, end);
                end++;
            }

            Shapes.CardBody(g, y, bottom + Shapes.CardPaddingBottom, fill);
            var rowTop = contentTop;
            for (var i = next; i < end; i++)
            {
                draw(g, i, rowTop);
                rowTop += measure(g, i);
            }
            Shapes.Tab(g, continued ? string.Format(words.Continued, label) : label, y);

            next = end;
            if (next < count)
            {
                g = pages.NewPage();
                y = PageStyle.Top;
                continued = true;
            }
            else
            {
                y = bottom + Shapes.CardPaddingBottom + CardGap;
            }
        }
        return y;
    }

    // Short lines ending in a colon, such as "Dressing:", label a group of ingredients.
    private static bool IsSubheading(string line) => line.EndsWith(':') && line.Length <= 40;

    private static double IngredientHeight(XGraphics g, string line) =>
        IsSubheading(line)
            ? TextLayout.Height(g, line, PageStyle.BodySize, PageStyle.BodyLine, IngredientWidth, true) + 3
            : TextLayout.Height(g, line, PageStyle.BodySize, PageStyle.BodyLine, IngredientWidth) + 1;

    private static void DrawIngredient(XGraphics g, string line, double top)
    {
        if (IsSubheading(line))
        {
            TextLayout.Draw(g, line, PageStyle.BodySize, PageStyle.BodyLine, BulletX, top + 3,
                IngredientWidth, PageStyle.Text, bold: true);
            return;
        }

        var cy = top + PageStyle.BodyLine / 2;
        g.DrawEllipse(new XSolidBrush(PageStyle.Leaf), BulletX - 2.6, cy - 2.6, 5.2, 5.2);
        TextLayout.Draw(g, line, PageStyle.BodySize, PageStyle.BodyLine, IngredientX, top,
            IngredientWidth, PageStyle.Text);
    }

    private static double StepHeight(XGraphics g, string step) =>
        Math.Max(17, TextLayout.Height(g, step, PageStyle.BodySize, PageStyle.BodyLine, StepWidth) + 4);

    private static void DrawStep(XGraphics g, int index, string step, double top)
    {
        var height = StepHeight(g, step);
        if (index % 2 == 0)
        {
            g.DrawRoundedRectangle(new XSolidBrush(PageStyle.Stripe),
                new XRect(PageStyle.Left + 10, top, PageStyle.ContentWidth - 18, height), new XSize(6, 6));
        }

        var cx = PageStyle.Left + 26;
        var cy = top + 2 + PageStyle.BodyLine / 2;
        g.DrawEllipse(new XSolidBrush(PageStyle.Step), cx - 8, cy - 8, 16, 16);
        TextLayout.DrawCentered(g, (index + 1).ToString(), 8.5, cx, cy - 8.5 * 1.17 / 2, XColors.White, bold: true);

        TextLayout.Draw(g, step, PageStyle.BodySize, PageStyle.BodyLine, StepX, top + 2,
            StepWidth, PageStyle.Text);
    }

    private static List<(string Label, string Value)> GoodItems(RecipeSheet r, BookWords words) =>
        new List<(string, string)>
        {
            (words.MadeAhead, r.Ahead),
            (words.Frozen, r.Frozen),
            (words.Leftovers, r.Leftovers)
        }
        .Where(item => item.Item2.Length > 0)
        .ToList();

    private const double GoodLabelSize = 10;
    private const double GoodLabelLine = 12.5;
    private const double GoodValueSize = 12;
    private const double GoodValueLine = 15;
    private const double GoodNotesWidth = PageStyle.ContentWidth - 44;

    private static double GoodColumnTextWidth(int columns) => PageStyle.ContentWidth / Math.Max(1, columns) - 40;

    // Zero when the recipe has nothing for Good to know.
    private static double GoodHeight(XGraphics g, List<(string Label, string Value)> items, List<string> notes)
    {
        if (items.Count == 0 && notes.Count == 0) return 0;

        var notesHeight = notes.Sum(n => TextLayout.Height(g, n, PageStyle.BodySize, PageStyle.BodyLine, GoodNotesWidth));
        if (notes.Count > 0 && items.Count > 0) notesHeight += 4;

        var labelHeight = items.Count == 0
            ? 0
            : items.Max(i => TextLayout.Height(g, i.Label + ":", GoodLabelSize, GoodLabelLine, GoodColumnTextWidth(items.Count)));
        var valueHeight = items.Count == 0 ? 0 : GoodValueLine;

        return Shapes.CardContentTop + notesHeight + labelHeight + valueHeight + Shapes.CardPaddingBottom;
    }

    private static void DrawGood(
        XGraphics g, List<(string Label, string Value)> items, List<string> notes,
        BookWords words, double top, double height)
    {
        Shapes.CardBody(g, top, top + height, PageStyle.CardFill, accent: true);

        var y = top + Shapes.CardContentTop;
        foreach (var note in notes)
            y += TextLayout.Draw(g, note, PageStyle.BodySize, PageStyle.BodyLine, PageStyle.Left + 22, y,
                GoodNotesWidth, PageStyle.Text);
        if (notes.Count > 0 && items.Count > 0) y += 4;

        if (items.Count > 0)
        {
            var columnWidth = PageStyle.ContentWidth / items.Count;
            var textWidth = GoodColumnTextWidth(items.Count);
            var labelHeight = items.Max(i => TextLayout.Height(g, i.Label + ":", GoodLabelSize, GoodLabelLine, textWidth));
            var divider = new XPen(PageStyle.Divider, 0.75);

            for (var i = 0; i < items.Count; i++)
            {
                var x = PageStyle.Left + i * columnWidth;
                if (i > 0) g.DrawLine(divider, x, y, x, y + labelHeight + GoodValueLine);
                TextLayout.Draw(g, items[i].Label + ":", GoodLabelSize, GoodLabelLine, x + 22, y,
                    textWidth, PageStyle.Text);
                g.DrawString(items[i].Value, PageStyle.Font(GoodValueSize, true), new XSolidBrush(PageStyle.Ink),
                    x + 22, y + labelHeight + 1, XStringFormats.TopLeft);
            }
        }

        Shapes.Tab(g, words.GoodToKnow, top);
    }
}