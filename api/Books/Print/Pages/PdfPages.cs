using PdfSharp;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Books.Print.Pages;

// The document being drawn. Adds Letter pages and hands out one drawing
// surface at a time; Finish adds the footers and the watermark and saves.

internal sealed class PdfPages : IDisposable
{
    private readonly PdfDocument doc = new();
    private readonly List<XImage> images = [];
    private XGraphics? gfx;

    public PdfPages(string title)
    {
        PdfFonts.Register();
        doc.Info.Title = title;
        doc.Info.Author = BookPdf.FooterText;
    }

    // Number of the page being drawn, starting at 1.
    public int PageNumber => doc.PageCount;

    public XGraphics NewPage()
    {
        gfx?.Dispose();
        var page = doc.AddPage();
        page.Size = PageSize.Letter;
        gfx = XGraphics.FromPdfPage(page);
        return gfx;
    }

    // Draws on an earlier page again, such as the cover once page numbers are known.
    public XGraphics Reopen(int pageNumber)
    {
        gfx?.Dispose();
        gfx = XGraphics.FromPdfPage(doc.Pages[pageNumber - 1], XGraphicsPdfPageOptions.Append);
        return gfx;
    }

    // Keeps an image open until the document is saved.
    public XImage? Keep(XImage? image)
    {
        if (image is not null) images.Add(image);
        return image;
    }

    // hasCover leaves the watermark off page 1.
    public byte[] Finish(BookWords words, bool spanish, bool hasCover)
    {
        gfx?.Dispose();
        gfx = null;

        var total = doc.PageCount;
        for (var i = 0; i < total; i++)
        {
            using var g = XGraphics.FromPdfPage(doc.Pages[i], XGraphicsPdfPageOptions.Append);
            Shapes.Footer(g, $"{words.Page} {i + 1} {words.Of} {total}");
        }

        PdfWatermark.Apply(doc, BookImages.Logo(spanish), skipFirst: hasCover);

        using var stream = new MemoryStream();
        doc.Save(stream, false);
        return stream.ToArray();
    }

    public void Dispose()
    {
        gfx?.Dispose();
        foreach (var image in images) image.Dispose();
        doc.Dispose();
    }
}