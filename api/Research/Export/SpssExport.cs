using System.Globalization;
using System.IO.Compression;
using System.Text;

namespace VeggieBook.Api.Research.Export;

// A sheet for SPSS, as a .zip with:
//
//   <name>.csv   the data, ready for SPSS
//   <name>.sps   SPSS syntax that loads the CSV and sets every variable
//                label and value label
//   README.txt   how to open it
//
// How each column becomes SPSS variables:
//
//   question columns (q1, q2...)   one 0/1 variable per answer: q1_1 is
//                                  "Q1: Microwave", 1 = picked, 0 = not.
//                                  Blank when the book has no questions
//                                  (Secrets Books), so SPSS treats it as
//                                  missing, not as "not picked".
//   answer columns (q1_1 or        already 0/1 (the All Data files): kept
//   Q1_Microwave)                  as they are, with their full question
//                                  and answer as the label and 0/1
//                                  labeled "Not picked" and "Picked".
//   columns with a set of values   numbered codes (1, 2, 3...) with value
//                                  labels
//   number columns                 numeric
//   everything else                text (participant ID, dates, times,
//                                  recipe lists), up to SPSS's 32,767
//                                  character limit
//
// This is the standard way SPSS handles questions where people can pick
// more than one answer, and it means frequencies and cross-tabs work right
// away. Also opens in PSPP, the free alternative to SPSS.

public static class SpssExport
{
    private const int MaxStringBytes = 32767;

    private record Variable(
        string Name,
        string Label,
        string Format,
        IReadOnlyList<(string Code, string Label)> ValueLabels,
        Func<Dictionary<string, object?>, string> Read);

    public static byte[] Build(Sheet sheet, string filters, string baseName)
    {
        var variables = sheet.Columns.SelectMany(c => ToVariables(c, sheet)).ToList();

        using var zip = new MemoryStream();
        using (var archive = new ZipArchive(zip, ZipArchiveMode.Create, leaveOpen: true))
        {
            Write(archive, $"{baseName}.csv", BuildData(sheet, variables));
            Write(archive, $"{baseName}.sps", BuildSyntax(sheet, filters, baseName, variables));
            Write(archive, "README.txt", BuildReadme(baseName));
        }
        return zip.ToArray();
    }

    private static IEnumerable<Variable> ToVariables(SheetColumn column, Sheet sheet)
    {
        if (IsQuestion(column) && column.Values is { Count: > 0 })
        {
            var prefix = column.Key.ToUpperInvariant();
            for (var i = 0; i < column.Values.Count; i++)
            {
                var answer = column.Values[i];
                yield return new Variable(
                    $"{column.Key}_{i + 1}",
                    $"{prefix}: {answer}",
                    "F1.0",
                    [("0", "Not picked"), ("1", "Picked")],
                    row => row.GetValueOrDefault(column.Key) is string picked
                        ? (picked.Split("; ").Contains(answer) ? "1" : "0")
                        : "");
            }
            yield break;
        }

        if (IsAnswer(column))
        {
            yield return new Variable(column.Key, column.Label, "F1.0",
                [("0", "Not picked"), ("1", "Picked")],
                row => Convert.ToString(row.GetValueOrDefault(column.Key), CultureInfo.InvariantCulture) ?? "");
            yield break;
        }

        if (column.Type == "number")
        {
            yield return new Variable(column.Key, column.Label, "F8.0", [],
                row => Convert.ToString(row.GetValueOrDefault(column.Key), CultureInfo.InvariantCulture) ?? "");
            yield break;
        }

        if (column.Values is { Count: > 0 } values)
        {
            var codes = values
                .Select((v, i) => (Value: v, Code: (i + 1).ToString(CultureInfo.InvariantCulture)))
                .ToDictionary(x => x.Value, x => x.Code);
            yield return new Variable(column.Key, column.Label, "F3.0",
                codes.Select(kv => (kv.Value, kv.Key)).ToList(),
                row => row.GetValueOrDefault(column.Key) is string s && codes.TryGetValue(s, out var code)
                    ? code
                    : "");
            yield break;
        }

        var width = Math.Clamp(
            sheet.Rows.Select(r => Convert.ToString(r.GetValueOrDefault(column.Key)) ?? "")
                .Select(s => Encoding.UTF8.GetByteCount(s))
                .DefaultIfEmpty(1)
                .Max(),
            1, MaxStringBytes);
        yield return new Variable(column.Key, column.Label, $"A{width}", [],
            row => Convert.ToString(row.GetValueOrDefault(column.Key), CultureInfo.InvariantCulture) ?? "");
    }

    private static bool IsQuestion(SheetColumn column) =>
        column.Key.Length > 1 && column.Key[0] == 'q' && column.Key[1..].All(char.IsAsciiDigit);

    // One answer that is already a 0/1 number: a Q or q, the question
    // number, then an underscore (q1_1, Q1_Microwave, Q2_With_Latino_flavors).
    private static bool IsAnswer(SheetColumn column)
    {
        var key = column.Key;
        if (column.Type != "number" || key.Length < 3 || char.ToLowerInvariant(key[0]) != 'q') return false;

        var i = 1;
        while (i < key.Length && char.IsAsciiDigit(key[i])) i++;
        return i > 1 && i < key.Length - 1 && key[i] == '_';
    }

    private static string BuildData(Sheet sheet, List<Variable> variables)
    {
        var sb = new StringBuilder();
        sb.Append(string.Join(",", variables.Select(v => v.Name))).Append("\r\n");
        foreach (var row in sheet.Rows)
            sb.Append(string.Join(",", variables.Select(v => CsvExport.Escape(v.Read(row))))).Append("\r\n");
        return sb.ToString();
    }

    private static string BuildSyntax(Sheet sheet, string filters, string baseName, List<Variable> variables)
    {
        var sb = new StringBuilder();
        sb.AppendLine("* Encoding: UTF-8.");
        sb.AppendLine($"* VeggieBook2 research data: {sheet.Title}.");
        sb.AppendLine($"* Made {sheet.GeneratedAt:yyyy-MM-dd HH:mm} UTC. Filters: {filters}. Rows: {sheet.Rows.Count}.");
        sb.AppendLine("* Anonymous: rows are keyed by research ID, with no names or emails.");
        sb.AppendLine("* Keep this file and the CSV in the same folder. If SPSS can't find the CSV,");
        sb.AppendLine("* replace the FILE line below with the CSV's full path.");
        sb.AppendLine();
        sb.AppendLine("GET DATA");
        sb.AppendLine("  /TYPE=TXT");
        sb.AppendLine($"  /FILE='{baseName}.csv'");
        sb.AppendLine("  /ENCODING='UTF8'");
        sb.AppendLine("  /DELCASE=LINE");
        sb.AppendLine("  /DELIMITERS=\",\"");
        sb.AppendLine("  /QUALIFIER='\"'");
        sb.AppendLine("  /ARRANGEMENT=DELIMITED");
        sb.AppendLine("  /FIRSTCASE=2");
        sb.AppendLine("  /VARIABLES=");
        foreach (var v in variables)
            sb.AppendLine($"    {v.Name} {v.Format}");
        sb.AppendLine(".");
        sb.AppendLine();

        sb.AppendLine("VARIABLE LABELS");
        for (var i = 0; i < variables.Count; i++)
            sb.AppendLine($"  {(i == 0 ? "" : "/")}{variables[i].Name} '{Quote(variables[i].Label, 250)}'");
        sb.AppendLine(".");
        sb.AppendLine();

        var labelled = variables.Where(v => v.ValueLabels.Count > 0).ToList();
        if (labelled.Count > 0)
        {
            sb.AppendLine("VALUE LABELS");
            for (var i = 0; i < labelled.Count; i++)
            {
                var v = labelled[i];
                var labels = string.Join(" ", v.ValueLabels.Select(l => $"{l.Code} '{Quote(l.Label, 120)}'"));
                sb.AppendLine($"  {(i == 0 ? "" : "/")}{v.Name} {labels}");
            }
            sb.AppendLine(".");
            sb.AppendLine();
        }

        sb.AppendLine("EXECUTE.");
        return sb.ToString();
    }

    // Plain lines joined together (no multi-line string), so pasting the
    // file can never break it.
    private static string BuildReadme(string baseName)
    {
        string[] lines =
        [
            "VeggieBook2 research data for SPSS",
            "",
            "1. Unzip both files into the same folder.",
            $"2. In SPSS, open {baseName}.sps (File > Open > Syntax).",
            "3. Choose Run > All.",
            "",
            $"SPSS loads {baseName}.csv and sets every variable label and value label.",
            "If it can't find the CSV, edit the FILE line near the top of the .sps",
            "file to the CSV's full path, then run it again.",
            "",
            "Each answer is its own variable, named after its question and answer",
            "(for example Q1_Microwave), with 1 = picked and 0 = not picked. The",
            "full question is the variable's label. Blank means the book had no",
            "questions (Secrets Books).",
            "",
            "The data is anonymous: rows are keyed by research ID, with no names",
            "or emails. Also opens in PSPP, the free alternative to SPSS."
        ];
        return string.Join("\r\n", lines) + "\r\n";
    }

    // SPSS strings use single quotes; a quote inside is doubled.
    private static string Quote(string text, int max) =>
        (text.Length > max ? text[..max] : text).Replace("'", "''");

    private static void Write(ZipArchive archive, string name, string content)
    {
        var entry = archive.CreateEntry(name, CompressionLevel.Optimal);
        using var stream = entry.Open();
        var bytes = Encoding.UTF8.GetBytes(content);
        stream.Write(bytes);
    }
}