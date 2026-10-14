using Microsoft.EntityFrameworkCore;
using MigraDoc.DocumentObjectModel;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books.Print;

// A Secrets Book as a PDF: the cover, then one page per kept secret
// (printed again for each extra copy), in the category's own order. Each
// page has the picture, the secret, why it works, and its links.

internal static class SecretsBookPdf
{
    private sealed record SecretLinkLine(string Url, string? Label);

    private sealed record SecretPage(
        int Id,
        string Headline,
        string Body,
        string Why,
        string? Image,
        List<SecretLinkLine> Links);

    public static async Task<BookPdfFile> BuildAsync(
        VeggieBookContext content, BookPrint book, bool es, string imagesRoot)
    {
        var words = BookWords.For(es);
        var language = es ? "es" : "en";

        var category = await content.SecretCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == book.SecretCategoryId);
        var name = category is null ? "Secrets" : es ? category.NameEs : category.NameEn;

        var ids = book.Items.Select(i => i.Id).ToArray();
        var rows = await content.Secrets
            .AsNoTracking()
            .Where(s => ids.Contains(s.Id))
            .OrderBy(s => s.DisplayNumber)
            .ThenBy(s => s.Id)
            .Select(s => new
            {
                s.Id,
                Headline = es ? s.HeadlineEs : s.HeadlineEn,
                Body = es ? s.BodyEs : s.BodyEn,
                Why = es ? s.WhyItWorksEs : s.WhyItWorksEn,
                Image = es && s.ImagePathEs != null && s.ImagePathEs != ""
                    ? s.ImagePathEs
                    : s.ImagePathEn,
                Links = s.Links
                    .Where(l => l.Language == language)
                    .OrderBy(l => l.Id)
                    .Select(l => new { l.Url, Label = es ? l.LabelEs : l.LabelEn })
                    .ToList()
            })
            .ToListAsync();

        var secrets = rows
            .Select(s => new SecretPage(
                s.Id, s.Headline, s.Body ?? "", s.Why, s.Image,
                s.Links.Select(l => new SecretLinkLine(l.Url, l.Label)).ToList()))
            .ToList();

        var extras = book.Items.ToDictionary(i => i.Id, i => i.ExtraCopies);
        var cover = BookPdf.FromBytes(book.Upload)
            ?? BookPdf.FromFile(BookImages.Find(imagesRoot, book.CoverPath));

        var (doc, section) = BookPdf.Start($"Secrets Book: {name}", words);
        BookPdf.AddCover(section, es, cover, name,
            $"{words.Count(secrets.Count, secrets: true)}, {words.MadeOn(book.CreatedAt)}");

        foreach (var secret in secrets)
        {
            var copies = 1 + extras.GetValueOrDefault(secret.Id);
            for (var c = 0; c < copies; c++)
            {
                section.AddPageBreak();
                AddSecret(section, secret, name, words, imagesRoot);
            }
        }

        return new BookPdfFile(BookPdf.Render(doc, es), BookPdf.FileName("SecretsBook", name));
    }

    private static void AddSecret(Section section, SecretPage s, string category, BookWords words, string imagesRoot)
    {
        var label = section.AddParagraph(category.ToUpperInvariant());
        label.Format.Font.Size = 9;
        label.Format.Font.Bold = true;
        label.Format.Font.Color = BookPdf.Muted;
        label.Format.SpaceAfter = Unit.FromPoint(2);
        label.Format.KeepWithNext = true;

        var headline = BookPdf.Heading(section, BookPdf.Clean(s.Headline), 20);
        headline.Format.SpaceAfter = Unit.FromPoint(6);

        BookPdf.Picture(section, BookPdf.FromFile(BookImages.Find(imagesRoot, s.Image)), BookPdf.UsableWidth, 9.5);

        var body = BookPdf.Clean(s.Body);
        if (body.Length > 0)
        {
            var p = section.AddParagraph(body);
            p.Format.Font.Size = 12;
            p.Format.SpaceAfter = Unit.FromPoint(10);
        }

        var why = BookPdf.Clean(s.Why);
        if (why.Length > 0)
        {
            var cell = BookPdf.Box(section);
            var h = cell.AddParagraph(words.WhyItWorks);
            h.Format.Font.Bold = true;
            h.Format.Font.Color = BookPdf.Green;
            h.Format.SpaceAfter = Unit.FromPoint(3);
            var p = cell.AddParagraph(why);
            p.Format.Font.Size = 10.5;
        }

        if (s.Links.Count > 0)
        {
            var h = BookPdf.Heading(section, words.LearnMore, 11, green: true);
            h.Format.SpaceBefore = Unit.FromPoint(12);
            h.Format.SpaceAfter = Unit.FromPoint(3);
            foreach (var link in s.Links)
            {
                var text = string.IsNullOrWhiteSpace(link.Label)
                    ? link.Url
                    : $"{BookPdf.Clean(link.Label)}: {link.Url}";
                var p = section.AddParagraph(text);
                p.Format.Font.Size = 9.5;
                p.Format.Font.Color = BookPdf.Muted;
                p.Format.SpaceAfter = Unit.FromPoint(2);
            }
        }
    }
}