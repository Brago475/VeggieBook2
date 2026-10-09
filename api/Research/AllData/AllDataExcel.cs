using System.Globalization;
using ClosedXML.Excel;

namespace VeggieBook.Api.Research.AllData;

// Both All Data files in one Excel workbook:
//
//   Books                one row per book, answers as 0/1 columns
//   Recipes and secrets  one row per recipe or secret
//   Variables            every column of both sheets: name, label, type,
//                        and possible values
//   Questions            every question and answer, word for word, with
//                        the column that holds it
//   About                what the file is, the filters, when it was made
//
// Opens in Excel, Google Sheets, Numbers, and LibreOffice.

public static class AllDataExcel
{
    private const double MaxColumnWidth = 60;
    private const string HeaderFill = "#F4F4F5";

    public static byte[] Build(
        Sheet books,
        Sheet items,
        IReadOnlyList<AllDataQuestion> questions,
        string filters)
    {
        using var workbook = new XLWorkbook();

        WriteSheet(workbook.Worksheets.Add("Books"), books);
        WriteSheet(workbook.Worksheets.Add("Recipes and secrets"), items);
        WriteVariables(workbook.Worksheets.Add("Variables"), [books, items]);
        WriteQuestions(workbook.Worksheets.Add("Questions"), questions);
        WriteAbout(workbook.Worksheets.Add("About"), books, items, filters);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void WriteSheet(IXLWorksheet ws, Sheet sheet)
    {
        var columns = sheet.Columns;

        // Row 1 holds the short names (what SPSS and R read); the full
        // labels are in the Variables tab and in each header's comment.
        for (var c = 0; c < columns.Count; c++)
        {
            var cell = ws.Cell(1, c + 1);
            cell.Value = columns[c].Key;
            cell.CreateComment().AddText(columns[c].Label);
        }

        for (var r = 0; r < sheet.Rows.Count; r++)
        {
            var row = sheet.Rows[r];
            for (var c = 0; c < columns.Count; c++)
                SetValue(ws.Cell(r + 2, c + 1), columns[c], row.GetValueOrDefault(columns[c].Key));
        }

        StyleHeader(ws.Range(1, 1, 1, Math.Max(1, columns.Count)));
        ws.SheetView.FreezeRows(1);
        ws.SheetView.FreezeColumns(1);
        if (columns.Count > 0)
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

    private static void WriteVariables(IXLWorksheet ws, Sheet[] sheets)
    {
        string[] headers = ["Sheet", "Variable", "Label", "Type", "Values"];
        for (var c = 0; c < headers.Length; c++)
            ws.Cell(1, c + 1).Value = headers[c];

        var r = 2;
        foreach (var sheet in sheets)
        {
            foreach (var column in sheet.Columns)
            {
                ws.Cell(r, 1).Value = sheet.Title;
                ws.Cell(r, 2).Value = column.Key;
                ws.Cell(r, 3).Value = column.Label;
                ws.Cell(r, 4).Value = column.Type;
                ws.Cell(r, 5).Value = column.Values is null ? "" : string.Join("; ", column.Values);
                r++;
            }
        }

        StyleHeader(ws.Range(1, 1, 1, headers.Length));
        ws.SheetView.FreezeRows(1);
        FitColumns(ws);
    }

    private static void WriteQuestions(IXLWorksheet ws, IReadOnlyList<AllDataQuestion> questions)
    {
        string[] headers = ["Question", "Question text", "Column", "Answer", "Coding"];
        for (var c = 0; c < headers.Length; c++)
            ws.Cell(1, c + 1).Value = headers[c];

        var r = 2;
        foreach (var q in questions)
        {
            foreach (var x in q.Choices)
            {
                ws.Cell(r, 1).Value = $"Q{q.No}";
                ws.Cell(r, 2).Value = q.Label;
                ws.Cell(r, 3).Value = x.Key;
                ws.Cell(r, 4).Value = x.Text;
                ws.Cell(r, 5).Value = "1 = picked, 0 = not picked, empty = Secrets Book";
                r++;
            }
        }

        StyleHeader(ws.Range(1, 1, 1, headers.Length));
        ws.SheetView.FreezeRows(1);
        FitColumns(ws);
    }

    private static void WriteAbout(IXLWorksheet ws, Sheet books, Sheet items, string filters)
    {
        (string, string)[] lines =
        [
            ("File", "VeggieBook2 research data: all data"),
            ("Made", books.GeneratedAt.ToString("yyyy-MM-dd HH:mm") + " UTC"),
            ("Filters", filters),
            ("Books", $"{books.Rows.Count} rows, one per saved book"),
            ("Recipes and secrets", $"{items.Rows.Count} rows, one per recipe or secret in a book"),
            ("Linking", "Both sheets share participant_id and book_no."),
            ("Answers", "Each answer is its own column: 1 = picked, 0 = not picked, empty for Secrets Books."),
            ("Privacy", "Anonymous. Rows are keyed by research ID; no names or emails are included."),
            ("Variables", "The Variables tab lists every column's name, label, and values.")
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
        header.Style.Fill.BackgroundColor = XLColor.FromHtml(HeaderFill);
    }

    private static void FitColumns(IXLWorksheet ws)
    {
        ws.Columns().AdjustToContents();
        foreach (var column in ws.ColumnsUsed())
            if (column.Width > MaxColumnWidth) column.Width = MaxColumnWidth;
    }
}