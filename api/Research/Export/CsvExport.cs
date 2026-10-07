using System.Globalization;
using System.Text;

namespace VeggieBook.Api.Research.Export;

// A sheet as CSV. The header row uses the short column names
// (participant_id, q1) so it works in any analysis tool; the Excel export's
// Codebook tab has the full labels.
//
// Saved as UTF-8 with a byte order mark, which is what Excel looks for to
// show accents correctly. Lines end in CRLF, the CSV standard.

public static class CsvExport
{
    public static byte[] Build(Sheet sheet)
    {
        var sb = new StringBuilder();
        sb.Append(string.Join(",", sheet.Columns.Select(c => Escape(c.Key)))).Append("\r\n");

        foreach (var row in sheet.Rows)
        {
            sb.Append(string.Join(",", sheet.Columns.Select(c => Escape(row.GetValueOrDefault(c.Key)))));
            sb.Append("\r\n");
        }

        var bom = Encoding.UTF8.GetPreamble();
        var body = Encoding.UTF8.GetBytes(sb.ToString());
        return [.. bom, .. body];
    }

    public static string Escape(object? value)
    {
        if (value is null) return "";
        var text = Convert.ToString(value, CultureInfo.InvariantCulture) ?? "";
        return text.IndexOfAny([',', '"', '\n', '\r']) >= 0
            ? "\"" + text.Replace("\"", "\"\"") + "\""
            : text;
    }
}