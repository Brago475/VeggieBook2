using PdfSharp.Drawing;

namespace VeggieBook.Api.Books.Print.Pages;

// One tip section: a heading and its paragraphs and pictures, in order.
// ImagePath is a checked file path or null.
internal sealed record TipBlock(string Text, string? ImagePath);

internal sealed record TipSection(string Heading, List<TipBlock> Blocks);

// The vegetable's tips after the recipes, flowing across as many pages as
// needed. Pictures keep their own shape in a rounded frame.
internal static class TipsPages
{
    private const double TitleSize = 22;
    private const double HeadingSize = 13;
    private const double HeadingLine = 16;
    private const double PictureMaxWidth = 220;
    private const double PictureMaxHeight = 165;
    private const double Bottom = PageStyle.FooterTop - 12;

    // Draws the tips from a new page and returns that page's number.
    public static int Draw(PdfPages pages, string title, List<TipSection> sections)
    {
        var g = pages.NewPage();
        var firstPage = pages.PageNumber;
        var y = PageStyle.Top;

        y += TextLayout.Draw(g, title, TitleSize, TitleSize * 1.17, PageStyle.Left, y,
            PageStyle.ContentWidth, PageStyle.Ink, bold: true);
        Shapes.Underline(g, PageStyle.Left, y + 4, 78);
        y += 18;

        foreach (var section in sections)
        {
            var headingHeight = TextLayout.Height(g, section.Heading, HeadingSize, HeadingLine, PageStyle.ContentWidth, true);
            if (y + headingHeight + PageStyle.BodyLine > Bottom)
            {
                g = pages.NewPage();
                y = PageStyle.Top;
            }

            y += TextLayout.Draw(g, section.Heading, HeadingSize, HeadingLine, PageStyle.Left, y,
                PageStyle.ContentWidth, PageStyle.Label, bold: true) + 3;

            foreach (var block in section.Blocks)
            {
                if (block.Text.Length > 0)
                {
                    foreach (var line in TextLayout.Wrap(g, block.Text, PageStyle.BodySize, PageStyle.ContentWidth))
                    {
                        if (y + PageStyle.BodyLine > Bottom)
                        {
                            g = pages.NewPage();
                            y = PageStyle.Top;
                        }
                        DrawLine(g, line, PageStyle.Left, y);
                        y += PageStyle.BodyLine;
                    }
                    y += 5;
                }

                var picture = PhotoCrop.Fit(block.ImagePath, PictureMaxWidth, PictureMaxHeight);
                if (picture is { } p)
                {
                    pages.Keep(p.Image);
                    var frameWidth = p.Width + 8;
                    var frameHeight = p.Height + 8;
                    if (y + frameHeight > Bottom)
                    {
                        g = pages.NewPage();
                        y = PageStyle.Top;
                    }
                    Shapes.Photo(g, p.Image, new XRect((PageStyle.PageWidth - frameWidth) / 2, y, frameWidth, frameHeight));
                    y += frameHeight + 10;
                }
            }
            y += 8;
        }

        return firstPage;
    }

    private static void DrawLine(XGraphics g, List<PlacedRun> line, double x, double y)
    {
        var regular = PageStyle.Font(PageStyle.BodySize);
        var heavy = PageStyle.Font(PageStyle.BodySize, true);
        var brush = new XSolidBrush(PageStyle.Text);
        foreach (var run in line)
            g.DrawString(run.Text, run.Bold ? heavy : regular, brush, x + run.X, y, XStringFormats.TopLeft);
    }
}