using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace VeggieBook.Api.Books.Print;

// The faint, tilted VeggieBook logo behind every page of a book PDF.
// Drawn underneath the page content at the same spot on every page, below
// the recipe photo frame, then covered with nearly opaque white so it stays
// light in color and in black and white.

internal static class PdfWatermark
{
    private const double Strength = 0.07;
    private const double Angle = -18;
    private const double WidthShare = 0.7;

    // Vertical center as a share of page height.
    private const double CenterShare = 0.64;

    // Extra fade around the logo, in points, so its edge pixels never show.
    private const double FadeBleed = 4;

    private static readonly XSolidBrush Fade =
        new(XColor.FromArgb((int)Math.Round(255 * (1 - Strength)), 255, 255, 255));

    public static void Apply(PdfDocument pdf, string logoPath, bool skipFirst = false)
    {
        if (!File.Exists(logoPath)) return;

        using var logo = XImage.FromFile(logoPath);
        var ratio = logo.PixelWidth == 0 ? 1 : (double)logo.PixelHeight / logo.PixelWidth;

        for (var i = skipFirst ? 1 : 0; i < pdf.PageCount; i++)
        {
            var page = pdf.Pages[i];
            double pageWidth = page.Width;
            double pageHeight = page.Height;
            var width = pageWidth * WidthShare;
            var height = width * ratio;

            var center = new XPoint(pageWidth / 2, pageHeight * CenterShare);
            var box = new XRect(center.X - width / 2, center.Y - height / 2, width, height);
            var fade = new XRect(box.X - FadeBleed, box.Y - FadeBleed,
                box.Width + FadeBleed * 2, box.Height + FadeBleed * 2);

            using var gfx = XGraphics.FromPdfPage(page, XGraphicsPdfPageOptions.Prepend);
            gfx.RotateAtTransform(Angle, center);
            gfx.DrawImage(logo, box);
            gfx.DrawRectangle(Fade, fade);
        }
    }
}