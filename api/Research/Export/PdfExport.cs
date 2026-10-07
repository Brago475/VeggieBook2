using System.Globalization;
using MigraDoc.DocumentObjectModel;
using MigraDoc.DocumentObjectModel.Tables;
using MigraDoc.Rendering;

namespace VeggieBook.Api.Research.Export;

// A sheet as a PDF: US Letter, landscape.
//
//   a title, the filters, when it was made, and the row count
//   the table, with its header repeated on every page
//   a variables list at the end (each short name and its full label)
//   page numbers in the footer
//
// A sheet too wide for one page is split into parts. The participant ID and
// book number are repeated in every part, so rows can still be matched up.
// Question columns are headed Q1, Q2...; the variables list spells them out.

public static class PdfExport
{
    private static readonly Color Muted = new(107, 112, 105);
    private static readonly Color Line = new(229, 231, 227);
    private static readonly Color HeaderFill = new(246, 247, 245);

    // US Letter landscape is 27.94 cm wide; 1.5 cm margins on each side.
    private const double UsableWidth = 24.9;

    private static readonly HashSet<string> KeyColumns = ["participant_id", "book_no"];

    public static byte[] Build(Sheet sheet, string filters)
    {
        PdfFonts.Register();

        var doc = new Document();
        doc.Info.Title = $"VeggieBook2 research data: {sheet.Title}";

        var normal = doc.Styles[StyleNames.Normal]!;
        normal.Font.Name = PdfFonts.Family;
        normal.Font.Size = 8;

        var section = doc.AddSection();
        section.PageSetup = doc.DefaultPageSetup.Clone();
        section.PageSetup.PageFormat = PageFormat.Letter;
        section.PageSetup.Orientation = Orientation.Landscape;
        section.PageSetup.LeftMargin = Unit.FromCentimeter(1.5);
        section.PageSetup.RightMargin = Unit.FromCentimeter(1.5);
        section.PageSetup.TopMargin = Unit.FromCentimeter(1.5);
        section.PageSetup.BottomMargin = Unit.FromCentimeter(1.5);

        AddFooter(section);
        AddHeading(section, sheet, filters);

        if (sheet.Rows.Count == 0)
        {
            section.AddParagraph("No rows match these filters.");
        }
        else
        {
            var parts = SplitColumns(sheet.Columns);
            for (var p = 0; p < parts.Count; p++)
            {
                if (p > 0) section.AddPageBreak();
                if (parts.Count > 1)
                {
                    var label = section.AddParagraph($"Part {p + 1} of {parts.Count}");
                    label.Format.Font.Bold = true;
                    label.Format.SpaceAfter = Unit.FromPoint(4);
                }
                AddTable(section, sheet, parts[p]);
            }
        }

        AddVariables(section, sheet);

        var renderer = new PdfDocumentRenderer { Document = doc };
        renderer.RenderDocument();

        using var stream = new MemoryStream();
        renderer.PdfDocument.Save(stream, false);
        return stream.ToArray();
    }

    private static void AddHeading(Section section, Sheet sheet, string filters)
    {
        var title = section.AddParagraph($"VeggieBook2 research data: {sheet.Title}");
        title.Format.Font.Size = 14;
        title.Format.Font.Bold = true;
        title.Format.SpaceAfter = Unit.FromPoint(4);

        var meta = section.AddParagraph(
            $"Made {sheet.GeneratedAt:yyyy-MM-dd HH:mm} UTC   ·   Filters: {filters}   ·   " +
            $"{sheet.Rows.Count} rows   ·   Anonymous: rows are keyed by research ID, with no names or emails.");
        meta.Format.Font.Color = Muted;
        meta.Format.SpaceAfter = Unit.FromPoint(10);
    }

    private static void AddFooter(Section section)
    {
        var footer = section.Footers.Primary.AddParagraph();
        footer.Format.Alignment = ParagraphAlignment.Right;
        footer.Format.Font.Size = 7;
        footer.Format.Font.Color = Muted;
        footer.AddText("VeggieBook2 · Kean University   ·   Page ");
        footer.AddPageField();
        footer.AddText(" of ");
        footer.AddNumPagesField();
    }

    // Column width in centimeters, by what the column holds.
    private static double Width(SheetColumn column) => column switch
    {
        { Key: "participant_id" } => 3.1,
        { Type: "number" } => 1.9,
        { Type: "date" } => 2.2,
        { Type: "time" } => 1.4,
        _ when IsQuestion(column) => 6.0,
        _ => 2.9
    };

    private static bool IsQuestion(SheetColumn column) =>
        column.Key.Length > 1 && column.Key[0] == 'q' && column.Key[1..].All(char.IsAsciiDigit);

    private static string Header(SheetColumn column) =>
        IsQuestion(column) ? column.Key.ToUpperInvariant() : column.Label;

    // Groups of columns that each fit the page, every group starting with
    // the key columns.
    private static List<List<SheetColumn>> SplitColumns(IReadOnlyList<SheetColumn> columns)
    {
        var keys = columns.Where(c => KeyColumns.Contains(c.Key)).ToList();
        var rest = columns.Where(c => !KeyColumns.Contains(c.Key)).ToList();
        var keyWidth = keys.Sum(Width);

        var parts = new List<List<SheetColumn>>();
        var current = new List<SheetColumn>(keys);
        var used = keyWidth;

        foreach (var column in rest)
        {
            var width = Width(column);
            if (used + width > UsableWidth && current.Count > keys.Count)
            {
                parts.Add(current);
                current = new List<SheetColumn>(keys);
                used = keyWidth;
            }
            current.Add(column);
            used += width;
        }

        if (current.Count > keys.Count || parts.Count == 0) parts.Add(current);
        return parts;
    }

    private static void AddTable(Section section, Sheet sheet, List<SheetColumn> columns)
    {
        var table = section.AddTable();
        table.Borders.Width = 0.5;
        table.Borders.Color = Line;
        table.LeftPadding = Unit.FromPoint(3);
        table.RightPadding = Unit.FromPoint(3);
        table.TopPadding = Unit.FromPoint(2);
        table.BottomPadding = Unit.FromPoint(2);

        foreach (var column in columns)
        {
            var col = table.AddColumn(Unit.FromCentimeter(Width(column)));
            if (column.Type == "number") col.Format.Alignment = ParagraphAlignment.Right;
        }

        var header = table.AddRow();
        header.HeadingFormat = true;
        header.Shading.Color = HeaderFill;
        header.Format.Font.Bold = true;
        for (var c = 0; c < columns.Count; c++)
            header.Cells[c].AddParagraph(Header(columns[c]));

        foreach (var row in sheet.Rows)
        {
            var line = table.AddRow();
            for (var c = 0; c < columns.Count; c++)
            {
                var value = row.GetValueOrDefault(columns[c].Key);
                line.Cells[c].AddParagraph(
                    value is null ? "" : Convert.ToString(value, CultureInfo.InvariantCulture) ?? "");
            }
        }
    }

    private static void AddVariables(Section section, Sheet sheet)
    {
        section.AddPageBreak();

        var heading = section.AddParagraph("Variables");
        heading.Format.Font.Size = 12;
        heading.Format.Font.Bold = true;
        heading.Format.SpaceAfter = Unit.FromPoint(6);

        foreach (var column in sheet.Columns)
        {
            var p = section.AddParagraph();
            p.Format.SpaceAfter = Unit.FromPoint(3);
            p.AddFormattedText(column.Key, TextFormat.Bold);
            p.AddText($": {column.Label}");
            if (column.Values is { Count: > 0 })
            {
                var values = p.AddFormattedText($"   Values: {string.Join("; ", column.Values)}");
                values.Color = Muted;
            }
        }
    }
}