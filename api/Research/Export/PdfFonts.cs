using PdfSharp.Fonts;

namespace VeggieBook.Api.Research.Export;

// Tells PDFsharp where its font files are.
//
// On Linux, PDFsharp can't look fonts up by itself, so every PDF this API
// makes is drawn in DejaVu Sans, installed by the Dockerfile
// (fonts-dejavu-core). Whatever font a document asks for, it gets DejaVu,
// so a missing font can never break a PDF. The font is embedded in every
// PDF, so the file looks the same on any device.
//
// Register() is called before each PDF is made; it only takes effect once.

public class PdfFonts : IFontResolver
{
    public const string Family = "DejaVu Sans";

    private static readonly string[] Folders =
    [
        "/usr/share/fonts/truetype/dejavu",
        Path.Combine(AppContext.BaseDirectory, "Fonts")
    ];

    private static readonly object Gate = new();
    private static bool registered;
    private static readonly Dictionary<string, byte[]> Cache = [];

    public static void Register()
    {
        lock (Gate)
        {
            if (registered) return;
            GlobalFontSettings.FontResolver = new PdfFonts();
            registered = true;
        }
    }

    public FontResolverInfo? ResolveTypeface(string familyName, bool bold, bool italic) =>
        new(bold ? "DejaVuSans-Bold" : "DejaVuSans");

    public byte[]? GetFont(string faceName)
    {
        lock (Gate)
        {
            if (Cache.TryGetValue(faceName, out var cached)) return cached;

            foreach (var folder in Folders)
            {
                var path = Path.Combine(folder, faceName + ".ttf");
                if (!File.Exists(path)) continue;
                var bytes = File.ReadAllBytes(path);
                Cache[faceName] = bytes;
                return bytes;
            }
        }

        throw new InvalidOperationException(
            $"Font file {faceName}.ttf was not found. The API image must install fonts-dejavu-core (see api/Dockerfile).");
    }
}