using System.Text.RegularExpressions;
using PdfSharp.Drawing;

namespace VeggieBook.Api.Books.Print.Pages;

// Wraps and draws text for the drawn pages. Parts marked **like this** in
// the original text print in bold without the asterisks.

internal sealed record TextRun(string Text, bool Bold);

internal sealed record PlacedRun(string Text, bool Bold, double X);

internal static class TextLayout
{
    private static readonly Regex BoldMarks = new(@"\*\*(.+?)\*\*", RegexOptions.Compiled);

    public static List<TextRun> Words(string text, bool bold = false)
    {
        var words = new List<TextRun>();
        var at = 0;
        foreach (Match m in BoldMarks.Matches(text))
        {
            AddWords(words, text[at..m.Index], bold);
            AddWords(words, m.Groups[1].Value, true);
            at = m.Index + m.Length;
        }
        AddWords(words, text[at..], bold);
        return words;
    }

    private static void AddWords(List<TextRun> words, string part, bool bold)
    {
        foreach (var word in part.Replace("**", "").Split(' ', StringSplitOptions.RemoveEmptyEntries))
            words.Add(new TextRun(word, bold));
    }

    // Lines of words that fit within width, each word with its offset from the line start.
    public static List<List<PlacedRun>> Wrap(XGraphics g, string text, double size, double width, bool bold = false)
    {
        var regular = PageStyle.Font(size);
        var heavy = PageStyle.Font(size, true);
        var space = g.MeasureString(" ", regular).Width;

        var lines = new List<List<PlacedRun>>();
        var line = new List<PlacedRun>();
        double end = 0;

        foreach (var word in Words(text, bold))
        {
            var wordWidth = g.MeasureString(word.Text, word.Bold ? heavy : regular).Width;
            var start = line.Count == 0 ? 0 : end + space;
            if (line.Count > 0 && start + wordWidth > width)
            {
                lines.Add(line);
                line = [];
                start = 0;
            }
            line.Add(new PlacedRun(word.Text, word.Bold, start));
            end = start + wordWidth;
        }

        if (line.Count > 0) lines.Add(line);
        return lines;
    }

    public static double Height(XGraphics g, string text, double size, double lineHeight, double width, bool bold = false) =>
        Wrap(g, text, size, width, bold).Count * lineHeight;

    public static double Width(XGraphics g, string text, double size, bool bold = false) =>
        g.MeasureString(text, PageStyle.Font(size, bold)).Width;

    // Draws wrapped text with its top at y and returns the height used.
    public static double Draw(
        XGraphics g, string text, double size, double lineHeight,
        double x, double y, double width, XColor color, bool bold = false)
    {
        var regular = PageStyle.Font(size);
        var heavy = PageStyle.Font(size, true);
        var brush = new XSolidBrush(color);

        var lines = Wrap(g, text, size, width, bold);
        for (var i = 0; i < lines.Count; i++)
        {
            foreach (var run in lines[i])
            {
                g.DrawString(run.Text, run.Bold ? heavy : regular, brush,
                    x + run.X, y + i * lineHeight, XStringFormats.TopLeft);
            }
        }
        return lines.Count * lineHeight;
    }

    // One line, centered on cx.
    public static void DrawCentered(XGraphics g, string text, double size, double cx, double y, XColor color, bool bold = false)
    {
        var width = Width(g, text, size, bold);
        g.DrawString(text, PageStyle.Font(size, bold), new XSolidBrush(color), cx - width / 2, y, XStringFormats.TopLeft);
    }
}