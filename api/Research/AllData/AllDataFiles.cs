using System.IO.Compression;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Research.AllData;

// Both All Data files as one download, for the page's PDF and CSV buttons
// (Excel is AllDataExcel.cs).
//
//   Pdf  one PDF: Books first, then Recipes and secrets. Each part is made
//        by the existing PdfExport, then the pages are joined.
//   Csv  one .zip with books.csv and recipes-and-secrets.csv. CSV holds one
//        table per file, so the two can't share one file.

public static class AllDataFiles
{
    public static byte[] Pdf(Sheet books, Sheet items, string filters)
    {
        byte[][] parts =
        [
            AllDataBytes.From(PdfExport.Build(books, filters)),
            AllDataBytes.From(PdfExport.Build(items, filters))
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

    public static byte[] Csv(Sheet books, Sheet items)
    {
        using var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            Add(zip, "books.csv", AllDataBytes.From(CsvExport.Build(books)));
            Add(zip, "recipes-and-secrets.csv", AllDataBytes.From(CsvExport.Build(items)));
        }
        return stream.ToArray();
    }

    private static void Add(ZipArchive zip, string name, byte[] data)
    {
        var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
        using var target = entry.Open();
        target.Write(data, 0, data.Length);
    }
}