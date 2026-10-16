using System.Text;

namespace VeggieBook.Api.Research.AllData;

// Renames the All Data columns so every download is readable, not just
// the Excel file. The data itself stays the same.
//
//   ForPeople  names in words, for CSV and PDF: "Research ID",
//              "Date saved (Eastern)", and answers as "Q1: Microwave"
//   ForSpss    the same names made SPSS-safe (letters, numbers, and
//              underscores, 64 characters at most): "Research_ID",
//              "Q1_Microwave". The full question and answer stay as each
//              variable's label, so SPSS shows them in Variable View and
//              in every results table.

public static class AllDataReadable
{
    private const int SpssMaxName = 64;

    public static Sheet ForPeople(Sheet sheet, IReadOnlyList<AllDataQuestion> questions)
    {
        var names = Names(sheet, questions);
        return Rename(sheet, names, keepLabel: false);
    }

    public static Sheet ForSpss(Sheet sheet, IReadOnlyList<AllDataQuestion> questions)
    {
        var names = Names(sheet, questions)
            .ToDictionary(kv => kv.Key, kv => SpssName(kv.Value));
        return Rename(sheet, names, keepLabel: true);
    }

    // Each column's name in words, keyed by its short name.
    private static Dictionary<string, string> Names(Sheet sheet, IReadOnlyList<AllDataQuestion> questions)
    {
        var answers = questions
            .SelectMany(q => q.Choices.Select(x => (x.Key, Name: $"Q{q.No}: {x.Text}")))
            .ToDictionary(t => t.Key, t => t.Name);

        return sheet.Columns.ToDictionary(
            c => c.Key,
            c => answers.TryGetValue(c.Key, out var name) ? name : c.Label);
    }

    // New columns and rows under the new names. Names are made unique by
    // adding _2, _3... in the rare case two come out the same.
    private static Sheet Rename(Sheet sheet, Dictionary<string, string> names, bool keepLabel)
    {
        var used = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var newKey = new Dictionary<string, string>();
        foreach (var column in sheet.Columns)
        {
            var name = names[column.Key];
            var unique = name;
            for (var n = 2; !used.Add(unique); n++)
                unique = $"{name}_{n}";
            newKey[column.Key] = unique;
        }

        var columns = sheet.Columns
            .Select(c => c with
            {
                Key = newKey[c.Key],
                Label = keepLabel ? c.Label : newKey[c.Key]
            })
            .ToList();

        var rows = sheet.Rows
            .Select(row => sheet.Columns.ToDictionary(
                c => newKey[c.Key],
                c => row.GetValueOrDefault(c.Key)))
            .ToList();

        return sheet with { Columns = columns, Rows = rows };
    }

    // "Q1: Microwave" to Q1_Microwave; "Date saved (Eastern)" to
    // Date_saved_Eastern. Starts with a letter, at most 64 characters.
    private static string SpssName(string text)
    {
        var sb = new StringBuilder();
        foreach (var ch in text)
        {
            if (char.IsAsciiLetterOrDigit(ch)) sb.Append(ch);
            else if (sb.Length > 0 && sb[^1] != '_') sb.Append('_');
        }

        var name = sb.ToString().Trim('_');
        if (name.Length == 0 || !char.IsAsciiLetter(name[0])) name = "V_" + name;
        return name.Length > SpssMaxName ? name[..SpssMaxName].TrimEnd('_') : name;
    }
}