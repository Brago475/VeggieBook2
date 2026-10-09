using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research.AllData;

// The two All Data files, built as Sheets so the page and every download
// show exactly the same data.
//
//   Books                one row per saved book. Every answer choice is
//                        its own 0/1 column (q1_1, q1_2...): 1 = picked,
//                        0 = not picked, empty for Secrets Books, which have
//                        no questions. This is the shape SPSS wants.
//
//   Recipes and secrets  one row per recipe or secret in a saved book, with
//                        its status. With answers = true, the book's 0/1
//                        answer columns are repeated on every row, so the
//                        file works by itself without merging.
//
// Both files share participant_id and book_no, which link them.

public static class AllDataSheets
{
    public static async Task<Sheet> BooksAsync(
        AccountsContext db,
        VeggieBookContext content,
        SheetFilter filter)
    {
        var data = await AllDataSource.LoadAsync(db, content, filter);
        var questions = await AllDataSource.LoadQuestionsAsync(content);
        var known = questions.SelectMany(q => q.Choices).Select(x => x.Attribute).ToHashSet();

        var columns = new List<SheetColumn>();
        columns.AddRange(PersonColumns(data));
        columns.AddRange(BookColumns(data.Content));
        columns.AddRange(AnswerColumns(questions));
        columns.AddRange(
        [
            new("answers", "Answers picked (count)", "number"),
            new("recipes_kept", "Recipes kept", "number"),
            new("recipes_removed", "Recipes taken out later", "number"),
            new("secrets_kept", "Secrets kept", "number"),
            new("secrets_removed", "Secrets taken out later", "number"),
            new("extra_copies", "Extra copies", "number")
        ]);

        var rows = data.Books
            .Select(b =>
            {
                var row = BookCells(b, data.Content);
                AddAnswers(row, b, questions);
                row["answers"] = b.Kind == "secrets" ? null : b.Attributes.Count(known.Contains);
                row["recipes_kept"] = b.Items.Count(i => i.Type == "recipe" && i.Kept);
                row["recipes_removed"] = b.Items.Count(i => i.Type == "recipe" && !i.Kept);
                row["secrets_kept"] = b.Items.Count(i => i.Type == "secret" && i.Kept);
                row["secrets_removed"] = b.Items.Count(i => i.Type == "secret" && !i.Kept);
                row["extra_copies"] = b.Items.Where(i => i.Kept).Sum(i => i.ExtraCopies);
                return row;
            })
            .ToList();

        return new Sheet("books", "Books", DateTime.UtcNow, columns, rows);
    }

    public static async Task<Sheet> ItemsAsync(
        AccountsContext db,
        VeggieBookContext content,
        SheetFilter filter,
        bool withAnswers)
    {
        var data = await AllDataSource.LoadAsync(db, content, filter);
        List<AllDataQuestion> questions = withAnswers ? await AllDataSource.LoadQuestionsAsync(content) : [];

        var columns = new List<SheetColumn>();
        columns.AddRange(PersonColumns(data));
        columns.AddRange(BookColumns(data.Content));
        columns.AddRange(
        [
            new("item_type", "Item type", "text", ["Recipe", "Secret"]),
            new("item_code", "Item code", "text"),
            new("item_title", "Item", "text"),
            new("status", "Status", "text", ["Kept", "Taken out later"]),
            new("extra_copies", "Extra copies", "number")
        ]);
        columns.AddRange(AnswerColumns(questions));

        var rows = data.Books
            .SelectMany(b => b.Items
                .Select(i => (Item: i, Info: Info(i, data.Content)))
                .OrderBy(x => x.Item.Type == "recipe" ? 0 : 1)
                .ThenBy(x => x.Info.Code is null ? 1 : 0)
                .ThenBy(x => x.Info.Code)
                .ThenBy(x => x.Info.Title)
                .Select(x =>
                {
                    var row = BookCells(b, data.Content);
                    row["item_type"] = x.Item.Type == "secret" ? "Secret" : "Recipe";
                    row["item_code"] = x.Info.Code;
                    row["item_title"] = x.Info.Title;
                    row["status"] = x.Item.Kept ? "Kept" : "Taken out later";
                    row["extra_copies"] = x.Item.Kept ? x.Item.ExtraCopies : 0;
                    AddAnswers(row, b, questions);
                    return row;
                }))
            .ToList();

        return new Sheet("items", "Recipes and secrets", DateTime.UtcNow, columns, rows);
    }

    // ---- Columns ----

    private static List<SheetColumn> PersonColumns(AdData data) =>
    [
        new("participant_id", "Research ID", "text"),
        new("age_range", "Age range", "text",
            data.People.Values.Select(p => p.AgeRange).OfType<string>().Distinct().Order().ToList())
    ];

    private static List<SheetColumn> BookColumns(AdContent c) =>
    [
        new("book_no", "Book number for this person (1 = first)", "number"),
        new("date", $"Date saved ({AllDataSource.Local.Name})", "date"),
        new("time", $"Time saved ({AllDataSource.Local.Name})", "time"),
        new("day", "Day of the week", "text",
            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
        new("book_type", "Book type", "text", ["VeggieBook", "Secrets Book"]),
        new("vegetable", "Vegetable", "text", c.Vegetables.Values.Order().ToList()),
        new("secrets_category", "Secrets category", "text", c.Categories.Values.Order().ToList()),
        new("language", "Language", "text", ["English", "Spanish"]),
        new("cover", "Cover", "text", ["Built-in", "Personal"])
    ];

    // One 0/1 column per answer choice, labeled with the full question and
    // the full answer.
    private static IEnumerable<SheetColumn> AnswerColumns(List<AllDataQuestion> questions) =>
        questions.SelectMany(q => q.Choices.Select(x => new SheetColumn(
            x.Key,
            $"Q{q.No}. {q.Label} {x.Text} (1 = picked, 0 = not picked)",
            "number")));

    // ---- Cells ----

    private static Dictionary<string, object?> BookCells(AdBook b, AdContent c) => new()
    {
        ["participant_id"] = b.Person.ParticipantId,
        ["age_range"] = b.Person.AgeRange,
        ["book_no"] = b.BookNo,
        ["date"] = b.Local.ToString("yyyy-MM-dd"),
        ["time"] = b.Local.ToString("HH:mm"),
        ["day"] = b.Local.DayOfWeek.ToString(),
        ["book_type"] = b.Kind == "secrets" ? "Secrets Book" : "VeggieBook",
        ["vegetable"] = b.VegetableCode is null
            ? null
            : c.Vegetables.GetValueOrDefault(b.VegetableCode, b.VegetableCode),
        ["secrets_category"] = b.SecretCategoryId is null
            ? null
            : c.Categories.GetValueOrDefault(b.SecretCategoryId.Value),
        ["language"] = b.Language == "es" ? "Spanish" : "English",
        // The personal photo itself is never shown or exported.
        ["cover"] = b.HasUpload ? "Personal" : "Built-in"
    };

    private static void AddAnswers(
        Dictionary<string, object?> row,
        AdBook b,
        List<AllDataQuestion> questions)
    {
        foreach (var q in questions)
            foreach (var x in q.Choices)
                row[x.Key] = b.Kind == "secrets" ? null : b.Attributes.Contains(x.Attribute) ? 1 : 0;
    }

    private static AdItemInfo Info(AdItem item, AdContent c) => item.Type == "secret"
        ? c.Secrets.GetValueOrDefault(item.Id, new AdItemInfo(null, $"Secret {item.Id}"))
        : c.Recipes.GetValueOrDefault(item.Id, new AdItemInfo(null, $"Recipe {item.Id}"));
}