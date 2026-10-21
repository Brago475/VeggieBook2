using PdfSharp.Drawing;

namespace VeggieBook.Api.Books.Print.Pages;

// One line of the cover's contents card.
internal sealed record ContentsLine(string Title, int Page);

// The book's first page: logo, cover photo, name, recipe count and date,
// and the "In this book" card with page numbers. Drawn last, onto the page
// reserved for it, once every page number is known.
internal static class CoverPage
{
    private const double LogoWidth = 230;
    private const double NameSize = 36;
    private const double PillSize = 10;
    private const double RowHeight = 15;
    private const double RowSize = 10.5;
    private const double ColumnGap = 30;
    private const double PhotoMin = 150;
    private const double PhotoMax = 300;

    public static void Draw(
        PdfPages pages, XGraphics g, bool spanish, string name, string count, string made,
        byte[]? upload, string? coverPath, List<ContentsLine> recipes, ContentsLine? tips, BookWords words)
    {
        var cx = PageStyle.PageWidth / 2;
        var y = PageStyle.Top + 6;

        var logoPath = BookImages.Logo(spanish);
        if (File.Exists(logoPath))
        {
            var logo = pages.Keep(XImage.FromFile(logoPath))!;
            var logoHeight = LogoWidth * logo.PixelHeight / Math.Max(1, logo.PixelWidth);
            g.DrawImage(logo, cx - LogoWidth / 2, y, LogoWidth, logoHeight);
            y += logoHeight + 18;
        }

        var rows = (recipes.Count + 1) / 2;
        var contentsHeight = Shapes.CardContentTop + rows * RowHeight + (tips is null ? 0 : 22) + Shapes.CardPaddingBottom;
        const double nameBlock = 18 + NameSize * 1.17 + 8 + 14 + 19 + 22;
        var photoHeight = Math.Clamp(PageStyle.FooterTop - 14 - contentsHeight - nameBlock - y, PhotoMin, PhotoMax);

        var photo = pages.Keep(PhotoCrop.Fill(coverPath, upload, PageStyle.ContentWidth - 8, photoHeight - 8));
        Shapes.Photo(g, photo, new XRect(PageStyle.Left, y, PageStyle.ContentWidth, photoHeight));
        y += photoHeight + 18;

        var size = NameSize;
        while (size > 20 && TextLayout.Width(g, name, size, true) > PageStyle.ContentWidth) size -= 1;
        TextLayout.DrawCentered(g, name, size, cx, y, PageStyle.Ink, bold: true);
        y += size * 1.17 + 8;

        Shapes.Underline(g, cx - 41, y, 82);
        y += 14;

        var countWidth = Shapes.PillWidth(g, count, PillSize);
        var madeWidth = Shapes.PillWidth(g, made, PillSize);
        var pillsX = cx - (countWidth + 8 + madeWidth) / 2;
        Shapes.Pill(g, count, PillSize, pillsX, y);
        Shapes.Pill(g, made, PillSize, pillsX + countWidth + 8, y);
        y += Shapes.PillHeight(PillSize) + 22;

        DrawContents(g, recipes, tips, words, y, contentsHeight);
    }

    private static void DrawContents(
        XGraphics g, List<ContentsLine> recipes, ContentsLine? tips, BookWords words, double top, double height)
    {
        Shapes.CardBody(g, top, top + height, PageStyle.CardFill);

        var left = PageStyle.Left + 26;
        var columnWidth = (PageStyle.ContentWidth - 52 - ColumnGap) / 2;
        var rows = (recipes.Count + 1) / 2;
        var y = top + Shapes.CardContentTop;

        // Reads down the first column, then the second.
        for (var i = 0; i < recipes.Count; i++)
        {
            var x = i < rows ? left : left + columnWidth + ColumnGap;
            var rowY = y + (i < rows ? i : i - rows) * RowHeight;
            Line(g, recipes[i], x, rowY, columnWidth, PageStyle.Text, false);
        }

        if (tips is not null)
        {
            var tipsY = y + rows * RowHeight + 4;
            g.DrawLine(new XPen(PageStyle.Divider, 0.75), left, tipsY, left + PageStyle.ContentWidth - 52, tipsY);
            Line(g, tips, left, tipsY + 5, PageStyle.ContentWidth - 52, PageStyle.Label, true);
        }

        Shapes.Tab(g, words.InThisBook, top);
    }

    // Title on the left, page number on the right; long titles are shortened to fit.
    private static void Line(XGraphics g, ContentsLine line, double x, double y, double width, XColor color, bool bold)
    {
        var number = line.Page.ToString();
        var numberWidth = TextLayout.Width(g, number, RowSize);
        var title = Shorten(g, line.Title, RowSize, bold, width - numberWidth - 12);

        g.DrawString(title, PageStyle.Font(RowSize, bold), new XSolidBrush(color), x, y, XStringFormats.TopLeft);
        g.DrawString(number, PageStyle.Font(RowSize), new XSolidBrush(PageStyle.Muted),
            x + width - numberWidth, y, XStringFormats.TopLeft);
    }

    private static string Shorten(XGraphics g, string text, double size, bool bold, double width)
    {
        if (TextLayout.Width(g, text, size, bold) <= width) return text;
        var cut = text;
        while (cut.Length > 1 && TextLayout.Width(g, cut + "…", size, bold) > width) cut = cut[..^1];
        return cut.TrimEnd() + "…";
    }
}