using System.Globalization;
using ClosedXML.Excel;

namespace VeggieBook.Api.Research.AllData;

// Both All Data files in one Excel workbook that people can read and SPSS
// can import:
//
//   Books                one row per book, answers as 0/1 columns
//   Recipes and secrets  one row per recipe or secret
//   Variables            every column of both sheets: short name, label,
//                        type, and possible values
//   Questions            every question and answer, word for word
//   About                what the file is, the filters, when it was made
//
// Each data sheet has one header row with names in words: "Research ID",
// "Date saved", and for answers "Q1: Microwave". Hovering an answer header
// shows the full question. One header row is what SPSS expects: File >
// Import Data > Excel, with "Read variable names from the first row" on.
// SPSS turns each header into a short name (Q1Microwave) and keeps the
// words as the label.
//
// Opens in Excel, Google Sheets, Numbers, LibreOffice, SPSS, and PSPP.

public static class AllDataExcel
{
    private const double MaxColumnWidth = 60;
    private const double MinColumnWidth = 14;
    private const string HeaderFill = "#F4F4F5";
    private const string QuestionFill = "#E3F6E9";

    public static byte[] Build(
        Sheet books,
        Sheet items,
        IReadOnlyList<AllDataQuestion> questions,
        string filters)
    {
        using var workbook = new XLWorkbook();

        WriteSheet(workbook.Worksheets.Add("Books"), books, questions);
        WriteSheet(workbook.Worksheets.Add("Recipes and secrets"), items, questions);
        WriteVariables(workbook.Worksheets.Add("Variables"), [books, items]);
        WriteQuestions(workbook.Worksheets.Add("Questions"), questions);
        WriteAbout(workbook.Worksheets.Add("About"), books, items, filters);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void WriteSheet(IXLWorksheet ws, Sheet sheet, IReadOnlyList<AllDataQuestion> questions)
    {
        var columns = sheet.Columns;

        // Which question and answer each answer column (q1_1...) belongs to.
        var answerOf = questions
            .SelectMany(q => q.Choices.Select(x => (x.Key, Question: q, x.Text)))
            .ToDictionary(t => t.Key);

        for (var c = 0; c < columns.Count; c++)
        {
            var cell = ws.Cell(1, c + 1);
            if (answerOf.TryGetValue(columns[c].Key, out var answer))
            {
                cell.Value = $"Q{answer.Question.No}: {answer.Text}";
                cell.CreateComment().AddText($"Q{answer.Question.No}. {answer.Question.Label} {answer.Text} (1 = picked, 0 = not picked)");
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml(QuestionFill);
            }
            else
            {
                cell.Value = columns[c].Label;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml(HeaderFill);
            }
        }

        for (var r = 0; r < sheet.Rows.Count; r++)
        {
            var row = sheet.Rows[r];
            for (var c = 0; c < columns.Count; c++)
                SetValue(ws.Cell(r + 2, c + 1), columns[c], row.GetValueOrDefault(columns[c].Key));
        }

        if (columns.Count > 0)
        {
            var header = ws.Range(1, 1, 1, columns.Count);
            header.Style.Font.Bold = true;
            header.Style.Alignment.WrapText = true;
            header.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            ws.Row(1).Height = 48;
            ws.Range(1, 1, Math.Max(1, sheet.Rows.Count + 1), columns.Count).SetAutoFilter();
        }

        ws.SheetView.FreezeRows(1);
        ws.SheetView.FreezeColumns(1);
        FitColumns(ws, 2);
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
        string[] headers = ["Sheet", "Short name (SPSS)", "Label", "Type", "Values"];
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
        string[] headers = ["Question", "Question text", "Short name (SPSS)", "Answer", "Coding"];
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
            ("Headers", "One header row in words; answers read like \"Q1: Microwave\". Hover an answer header for the full question."),
            ("SPSS", "File > Import Data > Excel, with \"Read variable names from the first row\" on. Or use the SPSS download, which also labels 0 and 1."),
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

    // Widths from the content, starting at `fromRow` so a long header
    // doesn't stretch a column (it wraps instead); then kept between the
    // limits.
    private static void FitColumns(IXLWorksheet ws, int fromRow = 1)
    {
        ws.Columns().AdjustToContents(fromRow);
        foreach (var column in ws.ColumnsUsed())
        {
            if (column.Width > MaxColumnWidth) column.Width = MaxColumnWidth;
            if (column.Width < MinColumnWidth) column.Width = MinColumnWidth;
        }
    }
}