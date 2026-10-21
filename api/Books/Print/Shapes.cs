using PdfSharp.Drawing;

namespace VeggieBook.Api.Books.Print.Pages;

// The pieces the drawn pages are built from: footer, pill, underline,
// tabbed cards, the photo frame and the icon circles.

internal enum FactIcon { Clock, Pot, Utensils }

internal static class Shapes
{
    public const double TabHeight = 22;
    public const double TabTextSize = 14;

    // A card's outline starts this far below its tab's top, so the tab sits over the edge.
    public const double TabOverlap = 11;

    // Where a card's content starts, below its tab's top.
    public const double CardContentTop = TabHeight + 6;
    public const double CardPaddingBottom = 8;
    public const double CardRadius = 7.5;

    public static void Footer(XGraphics g, string pageText)
    {
        g.DrawLine(new XPen(PageStyle.Rule, 0.75), PageStyle.Left, PageStyle.FooterTop, PageStyle.Right, PageStyle.FooterTop);
        var font = PageStyle.Font(8);
        var brush = new XSolidBrush(PageStyle.Muted);
        g.DrawString(BookPdf.FooterText, font, brush, PageStyle.Left, PageStyle.FooterTop + 6, XStringFormats.TopLeft);
        var width = g.MeasureString(pageText, font).Width;
        g.DrawString(pageText, font, brush, PageStyle.Right - width, PageStyle.FooterTop + 6, XStringFormats.TopLeft);
    }

    public static double PillWidth(XGraphics g, string text, double size) =>
        TextLayout.Width(g, text, size, true) + 22;

    public static double PillHeight(double size) => size + 9;

    // A rounded green label; x is its left edge.
    public static void Pill(XGraphics g, string text, double size, double x, double y)
    {
        var height = PillHeight(size);
        var rect = new XRect(x, y, PillWidth(g, text, size), height);
        g.DrawRoundedRectangle(new XSolidBrush(PageStyle.PillFill), rect, new XSize(height, height));
        g.DrawString(text, PageStyle.Font(size, true), new XSolidBrush(PageStyle.PillText),
            x + 11, y + (height - size * 1.17) / 2, XStringFormats.TopLeft);
    }

    public static void Underline(XGraphics g, double x, double y, double width) =>
        g.DrawRoundedRectangle(new XSolidBrush(PageStyle.Leaf), new XRect(x, y, width, 2.5), new XSize(2, 2));

    // A card's outlined body, from its tab's top to bottom. accent adds a green left edge.
    public static void CardBody(XGraphics g, double tabTop, double bottom, XColor fill, bool accent = false)
    {
        var rect = new XRect(PageStyle.Left, tabTop + TabOverlap, PageStyle.ContentWidth, bottom - tabTop - TabOverlap);
        g.DrawRoundedRectangle(new XPen(PageStyle.CardBorder, 1.1), new XSolidBrush(fill), rect,
            new XSize(CardRadius * 2, CardRadius * 2));

        if (accent)
        {
            var barTop = tabTop + TabHeight;
            g.DrawRectangle(new XSolidBrush(PageStyle.Tab), PageStyle.Left, barTop, 3.75, bottom - CardRadius - barTop);
        }
    }

    // The green tab with an angled right edge, sitting over a card's top left corner.
    public static void Tab(XGraphics g, string label, double top)
    {
        const double slant = 20;
        var x = PageStyle.Left;
        var r = CardRadius;
        var width = Math.Max(150, TextLayout.Width(g, label, TabTextSize, true) + 50);

        var path = new XGraphicsPath();
        path.AddArc(x, top, r * 2, r * 2, 180, 90);
        path.AddLine(x + r, top, x + width - slant, top);
        path.AddLine(x + width - slant, top, x + width, top + TabHeight);
        path.AddLine(x + width, top + TabHeight, x, top + TabHeight);
        path.CloseFigure();
        g.DrawPath(new XSolidBrush(PageStyle.Tab), path);

        g.DrawString(label, PageStyle.Font(TabTextSize, true), XBrushes.White,
            x + 14, top + (TabHeight - TabTextSize * 1.17) / 2, XStringFormats.TopLeft);
    }

    // A photo inside a rounded white frame with a thin green border.
    public static void Photo(XGraphics g, XImage? image, XRect frame)
    {
        g.DrawRoundedRectangle(new XPen(PageStyle.FrameBorder, 1.1), XBrushes.White, frame, new XSize(18, 18));
        if (image is null) return;

        var inner = new XRect(frame.X + 4, frame.Y + 4, frame.Width - 8, frame.Height - 8);
        var clip = new XGraphicsPath();
        clip.AddRoundedRectangle(inner, new XSize(12, 12));

        var state = g.Save();
        g.IntersectClip(clip);
        g.DrawImage(image, inner);
        g.Restore(state);
    }

    // A green circle with a white line icon, centered on cx, cy.
    public static void IconCircle(XGraphics g, FactIcon icon, double cx, double cy, double radius)
    {
        g.DrawEllipse(new XSolidBrush(PageStyle.Leaf), cx - radius, cy - radius, radius * 2, radius * 2);

        var pen = new XPen(XColors.White, 1.5) { LineCap = XLineCap.Round, LineJoin = XLineJoin.Round };
        var s = radius / 13.5;

        switch (icon)
        {
            case FactIcon.Clock:
                g.DrawEllipse(pen, cx - 6.5 * s, cy - 6.5 * s, 13 * s, 13 * s);
                g.DrawLine(pen, cx, cy - 3.8 * s, cx, cy);
                g.DrawLine(pen, cx, cy, cx + 2.6 * s, cy + 1.8 * s);
                break;

            case FactIcon.Pot:
                g.DrawRoundedRectangle(pen, new XRect(cx - 6 * s, cy - 2 * s, 12 * s, 8 * s), new XSize(4 * s, 4 * s));
                g.DrawLine(pen, cx - 8 * s, cy - 2 * s, cx + 8 * s, cy - 2 * s);
                g.DrawLine(pen, cx - 2.5 * s, cy - 5 * s, cx + 2.5 * s, cy - 5 * s);
                g.DrawLine(pen, cx, cy - 5 * s, cx, cy - 6.5 * s);
                break;

            case FactIcon.Utensils:
                g.DrawLine(pen, cx - 4 * s, cy - 7 * s, cx - 4 * s, cy + 7 * s);
                g.DrawLine(pen, cx - 6 * s, cy - 7 * s, cx - 6 * s, cy - 2.5 * s);
                g.DrawLine(pen, cx - 2 * s, cy - 7 * s, cx - 2 * s, cy - 2.5 * s);
                g.DrawLine(pen, cx - 6 * s, cy - 2.5 * s, cx - 2 * s, cy - 2.5 * s);
                g.DrawLine(pen, cx + 4 * s, cy - 7 * s, cx + 4 * s, cy + 7 * s);
                g.DrawLine(pen, cx + 4 * s, cy - 7 * s, cx + 6.5 * s, cy - 3 * s);
                g.DrawLine(pen, cx + 6.5 * s, cy - 3 * s, cx + 6.5 * s, cy - 1 * s);
                g.DrawLine(pen, cx + 6.5 * s, cy - 1 * s, cx + 4 * s, cy - 1 * s);
                break;
        }
    }
}