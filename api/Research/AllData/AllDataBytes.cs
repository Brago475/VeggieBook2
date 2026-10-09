using System.Text;

namespace VeggieBook.Api.Research.AllData;

// The existing exporters (CsvExport, PdfExport, SpssExport) return bytes.
// This also accepts text or a stream, so the All Data files keep working
// if one of them changes.

internal static class AllDataBytes
{
    public static byte[] From(object data) => data switch
    {
        byte[] b => b,
        string s => Encoding.UTF8.GetBytes(s),
        Stream st => ReadAll(st),
        _ => throw new InvalidOperationException("Unexpected export type.")
    };

    private static byte[] ReadAll(Stream stream)
    {
        using var copy = new MemoryStream();
        stream.CopyTo(copy);
        return copy.ToArray();
    }
}