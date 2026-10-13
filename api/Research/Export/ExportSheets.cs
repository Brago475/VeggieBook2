using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Research.Export;

// Extra sheets for the Export page:
//
//   Codebook   every question and answer choice with its variable name
//   Content    every recipe and secret, with how often it was kept or taken
//              out in tracked books (same rules as All Data)

internal static class ExportSheets
{
    public static Sheet Codebook(IReadOnlyList<AllDataQuestion> questions)
    {
        var columns = new List<SheetColumn>
        {
            new("question_no", "Question number", "number"),
            new("variable", "Variable name in the Books file", "text"),
            new("question", "Question", "text"),
            new("answer", "Answer choice", "text")
        };

        var rows = questions
            .SelectMany(q => q.Choices.Select(c => new Dictionary<string, object?>
            {
                ["question_no"] = q.No,
                ["variable"] = c.Key,
                ["question"] = q.Label,
                ["answer"] = c.Text
            }))
            .ToList();

        return new Sheet("codebook", "Question codebook", DateTime.UtcNow, columns, rows);
    }

    public static async Task<Sheet> ContentAsync(
        AccountsContext db,
        VeggieBookContext content,
        SheetFilter filter,
        StudyWindow? study)
    {
        var data = await AllDataSource.LoadAsync(db, content, filter, study);

        var tally = data.Books
            .SelectMany(b => b.Items)
            .GroupBy(i => (i.Type, i.Id))
            .ToDictionary(g => g.Key, g => (Kept: g.Count(i => i.Kept), Out: g.Count(i => !i.Kept)));

        var vegetables = await content.Vegetables.AsNoTracking().ToDictionaryAsync(v => v.Code, v => v.NameEn);
        var categories = await content.SecretCategories.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.NameEn);

        var recipes = await content.Recipes
            .AsNoTracking()
            .OrderBy(r => r.DisplayCode == null)
            .ThenBy(r => r.DisplayCode)
            .ThenBy(r => r.Id)
            .Select(r => new { r.Id, r.DisplayCode, r.VegetableCode, r.TitleEn, r.Active })
            .ToListAsync();

        var secrets = await content.Secrets
            .AsNoTracking()
            .OrderBy(s => s.Category == null ? int.MaxValue : s.Category.Id)
            .ThenBy(s => s.DisplayNumber)
            .Select(s => new
            {
                s.Id,
                s.DisplayNumber,
                s.HeadlineEn,
                s.Active,
                CategoryId = s.Category == null ? (int?)null : s.Category.Id
            })
            .ToListAsync();

        var columns = new List<SheetColumn>
        {
            new("item_type", "Item type", "text", ["Recipe", "Secret"]),
            new("item_id", "Content ID", "number"),
            new("item_code", "Item code", "text"),
            new("item_title", "Item", "text"),
            new("subject", "Vegetable or Secrets category", "text"),
            new("in_app", "Shown in the app", "text", ["Yes", "No"]),
            new("kept", "Times kept in a saved book", "number"),
            new("taken_out", "Times taken out later", "number")
        };

        var rows = new List<Dictionary<string, object?>>();

        foreach (var r in recipes)
        {
            var count = tally.GetValueOrDefault(("recipe", r.Id));
            rows.Add(new()
            {
                ["item_type"] = "Recipe",
                ["item_id"] = r.Id,
                ["item_code"] = r.DisplayCode,
                ["item_title"] = r.TitleEn,
                ["subject"] = vegetables.GetValueOrDefault(r.VegetableCode, r.VegetableCode),
                ["in_app"] = r.Active ? "Yes" : "No",
                ["kept"] = count.Kept,
                ["taken_out"] = count.Out
            });
        }

        foreach (var s in secrets)
        {
            var count = tally.GetValueOrDefault(("secret", s.Id));
            rows.Add(new()
            {
                ["item_type"] = "Secret",
                ["item_id"] = s.Id,
                ["item_code"] = $"#{s.DisplayNumber}",
                ["item_title"] = s.HeadlineEn,
                ["subject"] = s.CategoryId is int c ? categories.GetValueOrDefault(c) : null,
                ["in_app"] = s.Active ? "Yes" : "No",
                ["kept"] = count.Kept,
                ["taken_out"] = count.Out
            });
        }

        return new Sheet("content", "Content library", DateTime.UtcNow, columns, rows);
    }
}