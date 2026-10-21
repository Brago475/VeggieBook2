using PdfSharp.Drawing;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Books.Print.Pages;

// Page size, fixed positions, colors and fonts for the drawn book pages.
// US Letter, in points (72 per inch), measured from the top left corner.

internal static class PageStyle
{
    public const double PageWidth = 612;
    public const double PageHeight = 792;
    public const double Left = 36;
    public const double Right = 576;
    public const double ContentWidth = Right - Left;
    public const double Top = 30;

    // The footer rule. All page content stays above it.
    public const double FooterTop = 756;

    public const double BodySize = 10.5;
    public const double BodyLine = 13.5;

    public static readonly XColor Ink = XColor.FromArgb(22, 48, 26);
    public static readonly XColor Text = XColor.FromArgb(31, 42, 26);
    public static readonly XColor Muted = XColor.FromArgb(107, 112, 105);
    public static readonly XColor Tab = XColor.FromArgb(74, 122, 55);
    public static readonly XColor Leaf = XColor.FromArgb(79, 127, 58);
    public static readonly XColor Step = XColor.FromArgb(63, 111, 53);
    public static readonly XColor Label = XColor.FromArgb(59, 109, 42);
    public static readonly XColor Facts = XColor.FromArgb(241, 245, 238);
    public static readonly XColor CardFill = XColor.FromArgb(250, 252, 248);
    public static readonly XColor Stripe = XColor.FromArgb(244, 248, 241);
    public static readonly XColor CardBorder = XColor.FromArgb(169, 194, 154);
    public static readonly XColor FrameBorder = XColor.FromArgb(185, 208, 170);
    public static readonly XColor Divider = XColor.FromArgb(201, 214, 191);
    public static readonly XColor PillFill = XColor.FromArgb(230, 239, 223);
    public static readonly XColor PillText = XColor.FromArgb(45, 90, 21);
    public static readonly XColor Rule = XColor.FromArgb(185, 192, 179);

    public static XFont Font(double size, bool bold = false)
    {
        PdfFonts.Register();
        return new XFont(PdfFonts.Family, size, bold ? XFontStyleEx.Bold : XFontStyleEx.Regular);
    }
}