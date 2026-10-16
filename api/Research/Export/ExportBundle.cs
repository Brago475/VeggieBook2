using System.IO.Compression;
using System.Text;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Research.Export;

// Zips for the Export page:
//
//   Build     the chosen sheets in the chosen formats, one folder per
//             format, with a README
//   Studies   every study in its own folder: the workbook and both CSV files

internal record StudyFiles(string Folder, Sheet Books, Sheet Items, IReadOnlyList<AllDataQuestion> Questions, string Filters);

internal static class ExportBundle
{
    public static readonly string[] Formats = ["xlsx", "csv", "spss", "pdf"];

    public static byte[] Build(IReadOnlyList<Sheet> sheets, IReadOnlyList<string> formats, string filters, string stamp)
    {
        using var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var sheet in sheets)
            {
                var name = $"veggiebook2-{Stem(sheet)}-{stamp}";
                foreach (var format in formats)
                {
                    switch (format)
                    {
                        case "xlsx":
                            Add(zip, $"excel/{name}.xlsx", ExcelExport.Build(sheet, filters));
                            break;
                        case "csv":
                            Add(zip, $"csv/{name}.csv", CsvExport.Build(sheet));
                            break;
                        case "pdf":
                            Add(zip, $"pdf/{name}.pdf", PdfExport.Build(sheet, filters));
                            break;
                        case "spss":
                            AddInner(zip, $"spss/{Stem(sheet)}/", SpssExport.Build(sheet, filters, name));
                            break;
                    }
                }
            }

            Add(zip, "README.txt", Encoding.UTF8.GetBytes(Readme(sheets, formats, filters, stamp)));
        }
        return ms.ToArray();
    }

    public static byte[] Studies(IReadOnlyList<StudyFiles> studies, string stamp)
    {
        using var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var s in studies)
            {
                Add(zip, $"{s.Folder}/veggiebook2-{s.Folder}-{stamp}.xlsx",
                    AllDataExcel.Build(s.Books, s.Items, s.Questions, s.Filters));
                Add(zip, $"{s.Folder}/books.csv", CsvExport.Build(s.Books));
                Add(zip, $"{s.Folder}/recipes-and-secrets.csv", CsvExport.Build(s.Items));
            }

            var lines = new StringBuilder();
            lines.AppendLine($"VeggieBook2 research data, every study, made {stamp}.");
            lines.AppendLine();
            lines.AppendLine("Each folder holds one study: an Excel workbook with both files, and the same two files as CSV.");
            lines.AppendLine("Only books saved while that study ran, by people whose tracking was on, are included.");
            lines.AppendLine("Rows are keyed by the anonymous research ID. No names or emails are included.");
            if (studies.Count == 0) lines.AppendLine().AppendLine("There are no studies yet.");
            Add(zip, "README.txt", Encoding.UTF8.GetBytes(lines.ToString()));
        }
        return ms.ToArray();
    }

    private static string Stem(Sheet sheet) => sheet.Name switch
    {
        "items" => "recipes-and-secrets",
        "codebook" => "question-codebook",
        "content" => "content-library",
        _ => sheet.Name
    };

    private static void Add(ZipArchive zip, string path, byte[] bytes)
    {
        var entry = zip.CreateEntry(path, CompressionLevel.Optimal);
        using var stream = entry.Open();
        stream.Write(bytes);
    }

    // Copies the files of an inner zip into a folder, instead of nesting zips.
    private static void AddInner(ZipArchive zip, string folder, byte[] inner)
    {
        using var source = new ZipArchive(new MemoryStream(inner), ZipArchiveMode.Read);
        foreach (var file in source.Entries.Where(e => e.Length > 0))
        {
            var entry = zip.CreateEntry(folder + file.FullName, CompressionLevel.Optimal);
            using var to = entry.Open();
            using var from = file.Open();
            from.CopyTo(to);
        }
    }

    private static string Readme(IReadOnlyList<Sheet> sheets, IReadOnlyList<string> formats, string filters, string stamp)
    {
        var text = new StringBuilder();
        text.AppendLine($"VeggieBook2 research data, made {stamp}.");
        text.AppendLine($"Filters: {filters}");
        text.AppendLine();
        text.AppendLine("Files:");
        foreach (var s in sheets) text.AppendLine($"  {Stem(s)}: {s.Title}, {s.Rows.Count} rows");
        text.AppendLine();
        text.AppendLine($"Formats: {string.Join(", ", formats)}");
        text.AppendLine();
        text.AppendLine("Books and Recipes and secrets link through participant_id and book_no.");
        text.AppendLine("Rows are keyed by the anonymous research ID. No names or emails are included.");
        text.AppendLine("Admin accounts, guests, and books saved while tracking was off are never included.");
        return text.ToString();
    }
}