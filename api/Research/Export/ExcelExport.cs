using System.Globalization;
using ClosedXML.Excel;

namespace VeggieBook.Api.Research.Export;

// A sheet as an Excel workbook (.xlsx) with three tabs:
//
//   the sheet   full column labels, bold frozen header, a filter arrow on
//               every column, and real dates
//   Codebook    every column's name, label, type, and possible values
//   About       what the file is, the filters used, when it was made
//
// Opens in Excel, Google Sheets, Numbers, and LibreOffice.

public static class ExcelExport
{
    private const double MaxColumnWidth = 60;

    public static byte[] Build(Sheet sheet, string filters)
    {
        using var workbook = new XLWorkbook();

        WriteSheet(workbook.Worksheets.Add(sheet.Title), sheet);
        WriteCodebook(workbook.Worksheets.Add("Codebook"), sheet);
        WriteAbout(workbook.Worksheets.Add("About"), sheet, filters);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void WriteSheet(IXLWorksheet ws, Sheet sheet)
    {
        var columns = sheet.Columns;

        for (var c = 0; c < columns.Count; c++)
            ws.Cell(1, c + 1).Value = columns[c].Label;

        for (var r = 0; r < sheet.Rows.Count; r++)
        {
            var row = sheet.Rows[r];
            for (var c = 0; c < columns.Count; c++)
                SetValue(ws.Cell(r + 2, c + 1), columns[c], row.GetValueOrDefault(columns[c].Key));
        }

        StyleHeader(ws.Range(1, 1, 1, columns.Count));
        ws.SheetView.FreezeRows(1);
        ws.Range(1, 1, Math.Max(1, sheet.Rows.Count + 1), columns.Count).SetAutoFilter();
        FitColumns(ws);
    }

    private static void SetValue(IXLCell cell, SheetColumn column, object? value)
    {
        switch (value)
        {
            case null:
                return;
            case int i:
                cell.Value = i;
                return;
            case double d:
                cell.Value = d;
                return;
            case string s when column.Type == "date"
                && DateTime.TryParseExact(s, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var date):
                cell.Value = date;
                cell.Style.DateFormat.Format = "yyyy-mm-dd";
                return;
            default:
                cell.Value = Convert.ToString(value, CultureInfo.InvariantCulture);
                return;
        }
    }

    private static void WriteCodebook(IXLWorksheet ws, Sheet sheet)
    {
        string[] headers = ["Variable", "Label", "Type", "Values"];
        for (var c = 0; c < headers.Length; c++)
            ws.Cell(1, c + 1).Value = headers[c];

        for (var r = 0; r < sheet.Columns.Count; r++)
        {
            var column = sheet.Columns[r];
            ws.Cell(r + 2, 1).Value = column.Key;
            ws.Cell(r + 2, 2).Value = column.Label;
            ws.Cell(r + 2, 3).Value = column.Type;
            ws.Cell(r + 2, 4).Value = column.Values is null ? "" : string.Join("; ", column.Values);
        }

        StyleHeader(ws.Range(1, 1, 1, headers.Length));
        ws.SheetView.FreezeRows(1);
        FitColumns(ws);
    }

    private static void WriteAbout(IXLWorksheet ws, Sheet sheet, string filters)
    {
        (string, string)[] lines =
        [
            ("File", $"VeggieBook2 research data: {sheet.Title}"),
            ("Made", sheet.GeneratedAt.ToString("yyyy-MM-dd HH:mm") + " UTC"),
            ("Filters", filters),
            ("Rows", sheet.Rows.Count.ToString(CultureInfo.InvariantCulture)),
            ("Privacy", "Anonymous. Rows are keyed by research ID; no names or emails are included."),
            ("Codebook", "The Codebook tab lists every column's name, label, and values.")
        ];

        for (var r = 0; r < lines.Length; r++)
        {
            ws.Cell(r + 1, 1).Value = lines[r].Item1;
            ws.Cell(r + 1, 2).Value = lines[r].Item2;
        }

        ws.Column(1).Style.Font.Bold = true;
        FitColumns(ws);
    }

    private static void StyleHeader(IXLRange header)
    {
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#F6F7F5");
    }

    private static void FitColumns(IXLWorksheet ws)
    {
        ws.Columns().AdjustToContents();
        foreach (var column in ws.ColumnsUsed())
            if (column.Width > MaxColumnWidth) column.Width = MaxColumnWidth;
    }
}