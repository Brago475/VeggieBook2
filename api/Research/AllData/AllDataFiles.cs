using System.IO.Compression;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Research.AllData;

// Both All Data files as one download, for the page's PDF, CSV, and SPSS
// buttons (Excel is AllDataExcel.cs). Column names are in words in every
// format (see AllDataReadable.cs): "Q1: Microwave" in the PDF and CSV,
// Q1_Microwave in SPSS, where names can't have spaces.
//
//   Pdf   one PDF: Books first, then Recipes and secrets. Each part is made
//         by the existing PdfExport, then the pages are joined.
//   Csv   one .zip with books.csv and recipes-and-secrets.csv. CSV holds one
//         table per file, so the two can't share one file.
//   Spss  one .zip with a folder per file, each holding the data, the SPSS
//         syntax that labels every question, answer, and 0/1 code, and a
//         README (made by the existing SpssExport).

public static class AllDataFiles
{
    public static byte[] Pdf(Sheet books, Sheet items, IReadOnlyList<AllDataQuestion> questions, string filters)
    {
        byte[][] parts =
        [
            AllDataBytes.From(PdfExport.Build(AllDataReadable.ForPeople(books, questions), filters)),
            AllDataBytes.From(PdfExport.Build(AllDataReadable.ForPeople(items, questions), filters))
        ];

        using var output = new PdfDocument();
        output.Info.Title = "VeggieBook2 research data: all data";

        foreach (var part in parts)
        {
            using var input = PdfReader.Open(new MemoryStream(part), PdfDocumentOpenMode.Import);
            foreach (var page in input.Pages)
                output.AddPage(page);
        }

        using var stream = new MemoryStream();
        output.Save(stream);
        return stream.ToArray();
    }

    public static byte[] Csv(Sheet books, Sheet items, IReadOnlyList<AllDataQuestion> questions)
    {
        using var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            Add(zip, "books.csv", AllDataBytes.From(CsvExport.Build(AllDataReadable.ForPeople(books, questions))));
            Add(zip, "recipes-and-secrets.csv",
                AllDataBytes.From(CsvExport.Build(AllDataReadable.ForPeople(items, questions))));
        }
        return stream.ToArray();
    }

    public static byte[] Spss(
        Sheet books,
        Sheet items,
        IReadOnlyList<AllDataQuestion> questions,
        string filters,
        string stamp)
    {
        using var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            CopyInto(zip, "books/", AllDataBytes.From(SpssExport.Build(
                AllDataReadable.ForSpss(books, questions), filters, $"veggiebook2-books-{stamp}")));
            CopyInto(zip, "recipes-and-secrets/", AllDataBytes.From(SpssExport.Build(
                AllDataReadable.ForSpss(items, questions), filters, $"veggiebook2-recipes-and-secrets-{stamp}")));
        }
        return stream.ToArray();
    }

    private static void Add(ZipArchive zip, string name, byte[] data)
    {
        var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
        using var target = entry.Open();
        target.Write(data, 0, data.Length);
    }

    // SpssExport makes its own .zip; its files go into a folder of this one.
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
}