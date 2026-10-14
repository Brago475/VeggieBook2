namespace VeggieBook.Api.Books.Print;

// Finds pictures for book PDFs on disk.
//
// Site photos (recipes, covers, secrets) come from the images folder
// mounted into the API (docker-compose.yml, Images:Path). Paths from the
// database are checked to stay inside that folder. Only JPEG and PNG are
// used; anything else, or a missing file, is left out of the PDF.
//
// Logos ship with the API under Assets/Brand.

internal static class BookImages
{
    public const string DefaultRoot = "/srv/images";

    private static readonly string[] Supported = [".jpg", ".jpeg", ".png"];

    public static string Root(IConfiguration config) => config["Images:Path"] ?? DefaultRoot;

    public static string? Find(string root, string? relative)
    {
        if (string.IsNullOrWhiteSpace(relative)) return null;

        var clean = relative.Trim().TrimStart('/');
        if (clean.StartsWith("images/", StringComparison.Ordinal)) clean = clean["images/".Length..];
        if (!Supported.Contains(Path.GetExtension(clean).ToLowerInvariant())) return null;

        var rootFull = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        var full = Path.GetFullPath(Path.Combine(rootFull, clean));
        if (!full.StartsWith(rootFull, StringComparison.Ordinal)) return null;

        return File.Exists(full) ? full : null;
    }

    public static string Logo(bool spanish) =>
        Path.Combine(AppContext.BaseDirectory, "Assets", "Brand",
            spanish ? "logo-positive-es.png" : "logo-positive-en.png");
}