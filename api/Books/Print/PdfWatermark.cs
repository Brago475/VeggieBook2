using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace VeggieBook.Api.Books.Print;

// The faint, tilted VeggieBook logo behind every page of a book PDF.
// Drawn underneath the page content, then covered with nearly opaque white,
// so it stays light in color and in black and white.

internal static class PdfWatermark
{
    private const double Strength = 0.07;
    private const double Angle = -18;
    private const double WidthShare = 0.7;

    private static readonly XSolidBrush Fade =
        new(XColor.FromArgb((int)Math.Round(255 * (1 - Strength)), 255, 255, 255));

    public static void Apply(PdfDocument pdf, string logoPath)
    {
        if (!File.Exists(logoPath)) return;

        using var logo = XImage.FromFile(logoPath);
        var ratio = logo.PixelWidth == 0 ? 1 : (double)logo.PixelHeight / logo.PixelWidth;

        foreach (var page in pdf.Pages)
        {
            double pageWidth = page.Width;
            double pageHeight = page.Height;
            var width = pageWidth * WidthShare;
            var height = width * ratio;
            var box = new XRect((pageWidth - width) / 2, (pageHeight - height) / 2, width, height);

            using var gfx = XGraphics.FromPdfPage(page, XGraphicsPdfPageOptions.Prepend);
            gfx.RotateAtTransform(Angle, new XPoint(pageWidth / 2, pageHeight / 2));
            gfx.DrawImage(logo, box);
            gfx.DrawRectangle(Fade, box);
        }
    }
}