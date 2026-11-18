using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Books;

// A VeggieBook's tips: the vegetable's tips whose answer is among the book's
// answers, in their set order. The same choice the book's PDF prints
// (Print/VeggieBookPdf.cs), shaped like a playlist tip so the site shows
// both the same way.

public static class BookTips
{
    public static async Task<List<object>> LoadAsync(
        VeggieBookContext content,
        string vegetableCode,
        IReadOnlyCollection<string> attributes,
        bool spanish)
    {
        if (attributes.Count == 0) return [];
        var answers = attributes.ToArray();

        var vegetableName = await content.Vegetables
            .AsNoTracking()
            .Where(v => v.Code == vegetableCode)
            .Select(v => spanish ? v.NameEs : v.NameEn)
            .FirstOrDefaultAsync() ?? vegetableCode;

        var rows = await content.Tips
            .AsNoTracking()
            .Where(t => t.VegetableCode == vegetableCode && answers.Contains(t.Attribute))
            .OrderBy(t => t.SortOrder)
            .Select(t => new
            {
                t.Id,
                Title = spanish ? t.HeadingEs : t.HeadingEn,
                Blocks = t.Blocks
                    .OrderBy(b => b.Position)
                    .Select(b => new { text = spanish ? b.TextEs : b.TextEn, image = b.ImagePath })
                    .ToList()
            })
            .ToListAsync();

        return rows
            .Select(t => (object)new
            {
                kind = "tip",
                id = t.Id,
                vegetable = vegetableCode,
                vegetableName,
                title = t.Title,
                blocks = t.Blocks
            })
            .ToList();
    }
}