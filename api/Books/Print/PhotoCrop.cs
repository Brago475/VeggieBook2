using PdfSharp.Drawing;
using SkiaSharp;

namespace VeggieBook.Api.Books.Print.Pages;

// Prepares photos for the drawn pages with SkiaSharp. Fill crops a photo
// evenly from its center to an exact frame shape, so every recipe photo
// prints the same size without stretching. Fit keeps a photo's own shape.
// Both resample to print resolution and never enlarge past the original.

internal static class PhotoCrop
{
    private const double Dpi = 200;
    private const int Quality = 88;

    public static XImage? Fill(string? path, byte[]? bytes, double widthPt, double heightPt)
    {
        using var source = Decode(path, bytes);
        if (source is null || source.Width == 0 || source.Height == 0) return null;

        var aspect = widthPt / heightPt;
        float w = source.Width;
        float h = source.Height;
        var crop = w / h > aspect
            ? SKRect.Create((float)((w - h * aspect) / 2), 0, (float)(h * aspect), h)
            : SKRect.Create(0, (float)((h - w / aspect) / 2), w, (float)(w / aspect));

        var outWidth = (int)Math.Max(1, Math.Min(crop.Width, Math.Round(widthPt / 72 * Dpi)));
        var outHeight = (int)Math.Max(1, Math.Round(outWidth / aspect));
        return Encode(source, crop, outWidth, outHeight);
    }

    // The photo at its own shape, sized to fit within maxWidth by maxHeight points.
    public static (XImage Image, double Width, double Height)? Fit(string? path, double maxWidth, double maxHeight)
    {
        using var source = Decode(path, null);
        if (source is null || source.Width == 0 || source.Height == 0) return null;

        var ratio = (double)source.Width / source.Height;
        var width = Math.Min(maxWidth, maxHeight * ratio);
        var height = width / ratio;

        var outWidth = (int)Math.Max(1, Math.Min(source.Width, Math.Round(width / 72 * Dpi)));
        var outHeight = (int)Math.Max(1, Math.Round(outWidth / ratio));
        var image = Encode(source, SKRect.Create(0, 0, source.Width, source.Height), outWidth, outHeight);
        return image is null ? null : (image, width, height);
    }

    private static SKBitmap? Decode(string? path, byte[]? bytes)
    {
        try
        {
            if (bytes is { Length: > 0 }) return SKBitmap.Decode(bytes);
            if (path is not null && File.Exists(path)) return SKBitmap.Decode(path);
        }
        catch (Exception)
        {
            // An unreadable file prints as an empty frame.
        }
        return null;
    }

    private static XImage? Encode(SKBitmap source, SKRect crop, int width, int height)
    {
        try
        {
            using var surface = SKSurface.Create(new SKImageInfo(width, height));
            surface.Canvas.Clear(SKColors.White);
            using var image = SKImage.FromBitmap(source);
            surface.Canvas.DrawImage(image, crop, SKRect.Create(0, 0, width, height),
                new SKSamplingOptions(SKCubicResampler.Mitchell), null);

            using var snapshot = surface.Snapshot();
            using var data = snapshot.Encode(SKEncodedImageFormat.Jpeg, Quality);
            return XImage.FromStream(new MemoryStream(data.ToArray()));
        }
        catch (Exception)
        {
            return null;
        }
    }
}