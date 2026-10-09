using System.IO.Compression;
using System.Text;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Research.AllData;

// "Download all": one .zip with everything, ready for any program.
//
//   veggiebook2-all-data-DATE.xlsx   both files, Variables, Questions, About
//   csv/books.csv                    file 1 as CSV
//   csv/recipes-and-secrets.csv      file 2 as CSV
//   spss/...                         both files for SPSS (from SpssExport)
//   README.txt                       what is inside and how the files link

public static class AllDataPackage
{
    public static byte[] Build(
        Sheet books,
        Sheet items,
        IReadOnlyList<AllDataQuestion> questions,
        string filters,
        string stamp)
    {
        using var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            Add(zip, $"veggiebook2-all-data-{stamp}.xlsx", AllDataExcel.Build(books, items, questions, filters));
            Add(zip, "csv/books.csv", Bytes(CsvExport.Build(books)));
            Add(zip, "csv/recipes-and-secrets.csv", Bytes(CsvExport.Build(items)));
            CopyInto(zip, "spss/", Bytes(SpssExport.Build(books, filters, $"veggiebook2-books-{stamp}")));
            CopyInto(zip, "spss/", Bytes(SpssExport.Build(items, filters, $"veggiebook2-recipes-and-secrets-{stamp}")));
            Add(zip, "README.txt", Encoding.UTF8.GetBytes(Readme(books, items, filters)));
        }
        return stream.ToArray();
    }

    // The other exporters return bytes; this also accepts text or a stream,
    // so the package keeps working if one of them changes.
    private static byte[] Bytes(object data) => data switch
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

    private static void Add(ZipArchive zip, string name, byte[] data)
    {
        var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
        using var target = entry.Open();
        target.Write(data, 0, data.Length);
    }

    // SpssExport already makes a .zip; its files go into the spss folder.
    private static void CopyInto(ZipArchive zip, string folder, byte[] innerZip)
    {
        using var source = new ZipArchive(new MemoryStream(innerZip), ZipArchiveMode.Read);
        foreach (var file in source.Entries)
        {
            if (string.IsNullOrEmpty(file.Name)) continue;
            var entry = zip.CreateEntry(folder + file.FullName, CompressionLevel.Optimal);
            using var from = file.Open();
            using var to = entry.Open();
            from.CopyTo(to);
        }
    }

    private static string Readme(Sheet books, Sheet items, string filters) =>
        $"""
        VeggieBook2 research data: all data
        Made {books.GeneratedAt:yyyy-MM-dd HH:mm} UTC. Filters: {filters}.

        Two files, in three formats:

          Books                 {books.Rows.Count} rows, one per saved book.
          Recipes and secrets   {items.Rows.Count} rows, one per recipe or secret in a book.

        The Excel file has both, plus a Variables tab (every column explained)
        and a Questions tab (every question and answer, word for word).
        The csv folder has each file as CSV. The spss folder has each file
        with its SPSS syntax.

        Answers: each answer choice is its own column (q1_1, q1_2...).
        1 = picked, 0 = not picked, empty = Secrets Book (no questions).

        Linking: both files share participant_id and book_no. In SPSS, open
        Recipes and secrets, then Data > Merge Files > Add Variables, matching
        on those two columns, to bring in the book's answers.

        Privacy: anonymous. Rows are keyed by research ID; no names or
        emails are included.
        """;
}