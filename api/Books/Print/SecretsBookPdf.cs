using Microsoft.EntityFrameworkCore;
using MigraDoc.DocumentObjectModel;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books.Print;

// A Secrets Book as a PDF, in one of three forms:
//   the whole book     the cover, then one page per kept secret
//   one secret         just that secret's page
//   extra copies       just the secrets picked for extra copies, each
//                      printed as many times as picked, with no cover
// Secrets run in the category's own order. Each page has the picture, the
// secret, why it works, and its links.

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

    // Null when the book has no such secret, or no extra copies.
    public static async Task<BookPdfFile?> BuildAsync(
        VeggieBookContext content, BookPrint book, bool es, string imagesRoot,
        int? only = null, bool extras = false)
    {
        var words = BookWords.For(es);
        var language = es ? "es" : "en";

        var ids = book.Items
            .Where(i => (only is null || i.Id == only) && (!extras || i.ExtraCopies > 0))
            .Select(i => i.Id)
            .ToArray();
        if (ids.Length == 0) return null;

        var category = await content.SecretCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == book.SecretCategoryId);
        var name = category is null ? "Secrets" : es ? category.NameEs : category.NameEn;

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
        if (secrets.Count == 0) return null;

        if (only is not null)
        {
            var single = secrets[0];
            var title = BookPdf.Clean(single.Headline);
            var (one, page) = BookPdf.Start(title, words);
            AddSecret(page, single, name, words, imagesRoot);
            return new BookPdfFile(BookPdf.Render(one, es), BookPdf.FileName("Secret", title));
        }

        if (extras)
        {
            var copies = book.Items.ToDictionary(i => i.Id, i => i.ExtraCopies);
            var (extra, pages) = BookPdf.Start($"Secrets Book: {name}", words);
            var first = true;
            foreach (var secret in secrets)
            {
                for (var c = 0; c < copies.GetValueOrDefault(secret.Id); c++)
                {
                    if (!first) pages.AddPageBreak();
                    AddSecret(pages, secret, name, words, imagesRoot);
                    first = false;
                }
            }
            return new BookPdfFile(BookPdf.Render(extra, es), BookPdf.FileName("Extra-Copies", name));
        }

        var cover = BookPdf.FromBytes(book.Upload)
            ?? BookPdf.FromFile(BookImages.Find(imagesRoot, book.CoverPath));

        var (doc, section) = BookPdf.Start($"Secrets Book: {name}", words);
        BookPdf.AddCover(section, es, cover, name,
            $"{words.Count(secrets.Count, secrets: true)}, {words.MadeOn(book.CreatedAt)}");

        foreach (var secret in secrets)
        {
            section.AddPageBreak();
            AddSecret(section, secret, name, words, imagesRoot);
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