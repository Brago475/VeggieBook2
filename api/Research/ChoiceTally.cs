using System.Text.RegularExpressions;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// The Most chosen sheet: every answer on the self-profiling questions,
// ranked by how often it was picked. One row per answer.
//
// Built from the Responses sheet, so it always uses the same people, books,
// and filters as the rest of the Research page.
//
// Only VeggieBooks count; Secrets Books have no questions. Two counts:
//
//   books    how many VeggieBooks picked the answer. Someone who picks
//            Microwave in three books counts three times.
//   people   how many participants picked it at least once. Each person
//            counts once.
//
// A book can pick more than one answer, so percentages can add up to more
// than 100. Answers that tie on books share a rank.

public static partial class ChoiceTally
{
    [GeneratedRegex(@"^q(\d+)$")]
    private static partial Regex QuestionKey();

    public static async Task<Sheet> BuildAsync(
        AccountsContext db,
        VeggieBookContext content,
        SheetFilter filter)
    {
        var responses = await ResearchSheets.ResponsesAsync(db, content, filter);

        var books = responses.Rows
            .Where(r => r.GetValueOrDefault("book_type") as string == "VeggieBook")
            .ToList();

        var peopleTotal = books
            .Select(r => r.GetValueOrDefault("participant_id") as string)
            .OfType<string>()
            .Distinct()
            .Count();

        var questions = responses.Columns
            .Where(c => QuestionKey().IsMatch(c.Key))
            .ToList();

        var tallies = questions
            .SelectMany(q => (q.Values ?? []).Select(answer =>
            {
                var picked = books.Where(r => Picked(r, q.Key, answer)).ToList();
                return new Tally(
                    Number(q.Key),
                    QuestionText(q.Label),
                    answer,
                    picked.Count,
                    picked
                        .Select(r => r.GetValueOrDefault("participant_id") as string)
                        .OfType<string>()
                        .Distinct()
                        .Count());
            }))
            .OrderByDescending(t => t.Books)
            .ThenByDescending(t => t.People)
            .ThenBy(t => t.QuestionNo)
            .ToList();

        var columns = new List<SheetColumn>
        {
            new("rank", "Rank", "number"),
            new("question_no", "Question", "text",
                questions.Select(q => $"Q{Number(q.Key)}").ToList()),
            new("question", "Question text", "text"),
            new("answer", "Answer", "text"),
            new("books", "VeggieBooks that picked it", "number"),
            new("books_pct", $"Percent of VeggieBooks (n = {books.Count})", "number"),
            new("people", "People who picked it", "number"),
            new("people_pct", $"Percent of people (n = {peopleTotal})", "number")
        };

        var rows = tallies
            .Select(t => new Dictionary<string, object?>
            {
                ["rank"] = 1 + tallies.Count(x => x.Books > t.Books),
                ["question_no"] = $"Q{t.QuestionNo}",
                ["question"] = t.Question,
                ["answer"] = t.Answer,
                ["books"] = t.Books,
                ["books_pct"] = Percent(t.Books, books.Count),
                ["people"] = t.People,
                ["people_pct"] = Percent(t.People, peopleTotal)
            })
            .ToList();

        return new Sheet("choices", "Most chosen", DateTime.UtcNow, columns, rows);
    }

    private record Tally(int QuestionNo, string Question, string Answer, int Books, int People);

    // The Responses sheet joins the answers a book picked with "; ".
    private static bool Picked(Dictionary<string, object?> row, string key, string answer) =>
        row.GetValueOrDefault(key) is string value && value.Split("; ").Contains(answer);

    private static int Number(string key) => int.Parse(QuestionKey().Match(key).Groups[1].Value);

    // Column labels look like "Q3. What kinds of recipes...": keep the text.
    private static string QuestionText(string label)
    {
        var dot = label.IndexOf(". ", StringComparison.Ordinal);
        return dot < 0 ? label : label[(dot + 2)..];
    }

    private static double Percent(int count, int total) =>
        total == 0 ? 0 : Math.Round(100.0 * count / total, 1);
}