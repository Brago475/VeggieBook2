using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using MigraDoc.DocumentObjectModel;
using MigraDoc.DocumentObjectModel.Tables;
using MigraDoc.Rendering;
using PdfSharp.Drawing;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Books.Print;

// Shared pieces for book PDFs: the saved book as read for printing, text
// cleanup and file names, plus the MigraDoc layout the Secrets Book uses
// (US Letter portrait, footer, cover, pictures, boxes, rendering with the
// watermark). The VeggieBook is drawn by the classes in Pages/.

public sealed record BookPdfFile(byte[] Bytes, string FileName);

internal sealed record BookPrintItem(int Id, int ExtraCopies);

// A saved book, as read for printing. Items are the kept recipes or secrets.
internal sealed record BookPrint(
    Guid Id,
    string Kind,
    string Language,
    string? VegetableCode,
    int? SecretCategoryId,
    string? CoverPath,
    byte[]? Upload,
    DateTime CreatedAt,
    List<string> Attributes,
    List<BookPrintItem> Items);

// A picture ready for MigraDoc: a file path or base64 source, and width over height.
internal sealed record Picture(string Source, double Ratio);

internal static class BookPdf
{
    public static readonly Color Ink = new(31, 42, 26);
    public static readonly Color Muted = new(107, 112, 105);
    public static readonly Color Green = new(45, 90, 21);
    public static readonly Color Line = new(216, 219, 212);

    public const string FooterText = "VeggieBook2, Kean University";

    // US Letter portrait is 21.59 cm wide; 1.9 cm margins on each side.
    public const double UsableWidth = 17.79;
    private const double SideMargin = 1.9;

    private static readonly TimeZoneInfo Eastern = FindEastern();

    public static (Document Doc, Section Section) Start(string title, BookWords words)
    {
        PdfFonts.Register();

        var doc = new Document();
        doc.Info.Title = title;
        doc.Info.Author = FooterText;

        var normal = doc.Styles[StyleNames.Normal]!;
        normal.Font.Name = PdfFonts.Family;
        normal.Font.Size = 11;
        normal.Font.Color = Ink;

        var section = doc.AddSection();
        var setup = doc.DefaultPageSetup.Clone();
        setup.PageFormat = PageFormat.Letter;
        setup.Orientation = Orientation.Portrait;
        setup.LeftMargin = Unit.FromCentimeter(SideMargin);
        setup.RightMargin = Unit.FromCentimeter(SideMargin);
        setup.TopMargin = Unit.FromCentimeter(1.8);
        setup.BottomMargin = Unit.FromCentimeter(2.2);
        setup.FooterDistance = Unit.FromCentimeter(1.0);
        section.PageSetup = setup;

        AddFooter(section, words);
        return (doc, section);
    }

    private static void AddFooter(Section section, BookWords words)
    {
        var p = section.Footers.Primary.AddParagraph();
        p.Format.Font.Size = 8.5;
        p.Format.Font.Color = Muted;
        p.Format.Borders.Top.Width = 0.5;
        p.Format.Borders.Top.Color = Line;
        p.Format.Borders.DistanceFromTop = Unit.FromPoint(6);
        p.Format.AddTabStop(Unit.FromCentimeter(UsableWidth), TabAlignment.Right);
        p.AddText(FooterText);
        p.AddTab();
        p.AddText(words.Page + " ");
        p.AddPageField();
        p.AddText(" " + words.Of + " ");
        p.AddNumPagesField();
    }

    // Page 1: the logo, the chosen cover, the book's name, and a line under it.
    public static void AddCover(Section section, bool spanish, Picture? cover, string name, string subtitle)
    {
        var logo = FromFile(BookImages.Logo(spanish));
        if (logo is not null)
        {
            var p = section.AddParagraph();
            p.Format.Alignment = ParagraphAlignment.Center;
            p.Format.SpaceAfter = Unit.FromCentimeter(0.8);
            Place(p, logo, 8, 2.2);
        }

        if (cover is not null)
        {
            var p = section.AddParagraph();
            p.Format.Alignment = ParagraphAlignment.Center;
            p.Format.SpaceAfter = Unit.FromCentimeter(0.8);
            Place(p, cover, 15, 15.5);
        }

        var title = section.AddParagraph(name);
        title.Format.Alignment = ParagraphAlignment.Center;
        title.Format.Font.Size = 28;
        title.Format.Font.Bold = true;
        title.Format.SpaceAfter = Unit.FromPoint(4);

        var sub = section.AddParagraph(subtitle);
        sub.Format.Alignment = ParagraphAlignment.Center;
        sub.Format.Font.Size = 12;
        sub.Format.Font.Color = Muted;
    }

    public static Paragraph Heading(Section section, string text, double size, bool green = false)
    {
        var p = section.AddParagraph(text);
        p.Format.Font.Size = size;
        p.Format.Font.Bold = true;
        if (green) p.Format.Font.Color = Green;
        p.Format.KeepWithNext = true;
        return p;
    }

    // An outlined box the full width of the page with a green left edge, returned as its one cell.
    public static Cell Box(Section section)
    {
        var table = section.AddTable();
        table.LeftPadding = Unit.FromCentimeter(0.4);
        table.RightPadding = Unit.FromCentimeter(0.4);
        table.TopPadding = Unit.FromCentimeter(0.3);
        table.BottomPadding = Unit.FromCentimeter(0.3);
        table.AddColumn(Unit.FromCentimeter(UsableWidth));

        var cell = table.AddRow().Cells[0];
        cell.Borders.Top.Width = 0.75;
        cell.Borders.Top.Color = Line;
        cell.Borders.Right.Width = 0.75;
        cell.Borders.Right.Color = Line;
        cell.Borders.Bottom.Width = 0.75;
        cell.Borders.Bottom.Color = Line;
        cell.Borders.Left.Width = 2.5;
        cell.Borders.Left.Color = Green;
        return cell;
    }

    public static void Picture(Section section, Picture? picture, double maxWidth, double maxHeight)
    {
        if (picture is null) return;
        var p = section.AddParagraph();
        p.Format.Alignment = ParagraphAlignment.Center;
        p.Format.SpaceBefore = Unit.FromPoint(4);
        p.Format.SpaceAfter = Unit.FromPoint(10);
        Place(p, picture, maxWidth, maxHeight);
    }

    public static Picture? FromFile(string? path)
    {
        if (path is null || !File.Exists(path)) return null;
        try
        {
            using var image = XImage.FromFile(path);
            return new Picture(path, Ratio(image));
        }
        catch (Exception)
        {
            return null;
        }
    }

    public static Picture? FromBytes(byte[]? bytes)
    {
        if (bytes is null || bytes.Length == 0) return null;
        try
        {
            using var stream = new MemoryStream(bytes);
            using var image = XImage.FromStream(stream);
            return new Picture("base64:" + Convert.ToBase64String(bytes), Ratio(image));
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static double Ratio(XImage image) =>
        image.PixelHeight == 0 ? 1 : (double)image.PixelWidth / image.PixelHeight;

    // Fits a picture inside maxWidth by maxHeight (cm), keeping its shape.
    private static void Place(Paragraph p, Picture picture, double maxWidth, double maxHeight)
    {
        var width = Math.Min(maxWidth, maxHeight * picture.Ratio);
        var image = p.AddImage(picture.Source);
        image.LockAspectRatio = true;
        image.Width = Unit.FromCentimeter(width);
    }

    // hasCover leaves the watermark off page 1.
    public static byte[] Render(Document doc, bool spanish, bool hasCover = false)
    {
        var renderer = new PdfDocumentRenderer { Document = doc };
        renderer.RenderDocument();
        PdfWatermark.Apply(renderer.PdfDocument, BookImages.Logo(spanish), skipFirst: hasCover);

        using var stream = new MemoryStream();
        renderer.PdfDocument.Save(stream, false);
        return stream.ToArray();
    }

    // Removes any markup left in the original text.
    public static string Clean(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "";
        var plain = WebUtility.HtmlDecode(Regex.Replace(text, "<[^>]+>", " "));
        return Regex.Replace(plain, @"[ \t]+", " ").Trim();
    }

    // VeggieBook-Carrots.pdf. Letters and digits only, accents dropped.
    public static string FileName(string prefix, string name)
    {
        var plain = new StringBuilder();
        foreach (var c in name)
        {
            var simple = c switch
            {
                'á' or 'à' or 'ä' or 'â' => 'a', 'Á' => 'A',
                'é' or 'è' or 'ë' or 'ê' => 'e', 'É' => 'E',
                'í' or 'ì' or 'ï' or 'î' => 'i', 'Í' => 'I',
                'ó' or 'ò' or 'ö' or 'ô' => 'o', 'Ó' => 'O',
                'ú' or 'ù' or 'ü' or 'û' => 'u', 'Ú' => 'U',
                'ñ' => 'n', 'Ñ' => 'N',
                _ => c
            };
            plain.Append(char.IsAsciiLetterOrDigit(simple) ? simple : '-');
        }
        var safe = Regex.Replace(plain.ToString(), "-+", "-").Trim('-');
        return safe.Length == 0 ? $"{prefix}.pdf" : $"{prefix}-{safe}.pdf";
    }

    public static DateTime Local(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Eastern);

    private static TimeZoneInfo FindEastern()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}