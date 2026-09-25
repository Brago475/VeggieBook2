namespace VeggieBook.Api.Books;

// Checks and decodes an uploaded cover photo.
//
// The same rules as BooksController.DecodeJpeg and
// SecretBooksController.DecodeJpeg, which each keep their own copy so the
// save code stays exactly as it was tested. New code uses this one. If the
// rules change, change all three to match.
//
// Accepts only a JPEG data URL, as produced by the site's resizer, of at
// most 400 KB (the database's own limit). The bytes must start with the JPEG
// signature, so a renamed file of another type is refused even if it claims
// to be a JPEG.

public static class JpegUpload
{
    public const int MaxBytes = 400 * 1024;   // matches the database check

    private const string DataUrlPrefix = "data:image/jpeg;base64,";

    // The photo's bytes, or null if it is not an acceptable JPEG.
    public static byte[]? Decode(string dataUrl)
    {
        if (!dataUrl.StartsWith(DataUrlPrefix, StringComparison.Ordinal)) return null;

        var base64 = dataUrl.AsSpan(DataUrlPrefix.Length);
        if (base64.Length > (MaxBytes + 2) / 3 * 4) return null;

        var buffer = new byte[base64.Length * 3 / 4 + 3];
        if (!Convert.TryFromBase64Chars(base64, buffer, out var written)) return null;
        if (written < 4 || written > MaxBytes) return null;
        if (buffer[0] != 0xFF || buffer[1] != 0xD8 || buffer[2] != 0xFF) return null;

        return buffer.AsSpan(0, written).ToArray();
    }
}