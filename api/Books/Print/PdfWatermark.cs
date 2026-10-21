using PdfSharp.Drawing;
using PdfSharp.Pdf;
using SkiaSharp;

namespace VeggieBook.Api.Books.Print;

// The faint, tilted VeggieBook logo on every page of a book PDF, at the
// same spot on each page, below the recipe photo. It is drawn on top of the
// page content as a pre-faded image, so cards and filled boxes never hide
// it, and text under it stays fully readable.

internal static class PdfWatermark
{
    private const float Strength = 0.07f;
    private const double Angle = -18;
    private const double WidthShare = 0.7;

    // Vertical center as a share of page height.
    private const double CenterShare = 0.64;

    public static void Apply(PdfDocument pdf, string logoPath, bool skipFirst = false)
    {
        using var logo = Faded(logoPath);
        if (logo is null) return;

        var ratio = logo.PixelWidth == 0 ? 1 : (double)logo.PixelHeight / logo.PixelWidth;

        for (var i = skipFirst ? 1 : 0; i < pdf.PageCount; i++)
        {
            var page = pdf.Pages[i];
            var pageWidth = page.Width.Point;
            var pageHeight = page.Height.Point;
            var width = pageWidth * WidthShare;
            var height = width * ratio;

            var center = new XPoint(pageWidth / 2, pageHeight * CenterShare);
            var box = new XRect(center.X - width / 2, center.Y - height / 2, width, height);

            using var gfx = XGraphics.FromPdfPage(page, XGraphicsPdfPageOptions.Append);
            gfx.RotateAtTransform(Angle, center);
            gfx.DrawImage(logo, box);
        }
    }

    // The logo at Strength opacity on a transparent background.
    private static XImage? Faded(string path)
    {
        if (!File.Exists(path)) return null;
        try
        {
            using var source = SKBitmap.Decode(path);
            if (source is null || source.Width == 0 || source.Height == 0) return null;

            using var surface = SKSurface.Create(new SKImageInfo(source.Width, source.Height));
            surface.Canvas.Clear(SKColors.Transparent);
            using var paint = new SKPaint { Color = SKColors.White.WithAlpha((byte)Math.Round(255 * Strength)) };
            using var image = SKImage.FromBitmap(source);
            surface.Canvas.DrawImage(image, 0, 0, paint);

            using var snapshot = surface.Snapshot();
            using var data = snapshot.Encode(SKEncodedImageFormat.Png, 100);
            return XImage.FromStream(new MemoryStream(data.ToArray()));
        }
        catch (Exception)
        {
            return null;
        }
    }
}