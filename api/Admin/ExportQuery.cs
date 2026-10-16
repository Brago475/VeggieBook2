using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Admin;

// Query string filters shared by All Data and Export. Every key is optional:
//
//   from, to       yyyy-MM-dd, Eastern
//   age            an age range
//   vegetable      a vegetable code (BROCCOLI)
//   study          a study number
//   participant    a research ID
//   book           a book number for that research ID
//   category       a Secrets category id
//   recipes        recipe ids, comma separated
//   secrets        secret ids, comma separated
//   answers        true repeats each book's answers on the recipe rows

public sealed class ExportQuery
{
    private const int MaxIds = 500;

    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public string? Age { get; set; }
    public string? Vegetable { get; set; }
    public int? Study { get; set; }
    public string? Participant { get; set; }
    public int? Book { get; set; }
    public int? Category { get; set; }
    public string? Recipes { get; set; }
    public string? Secrets { get; set; }
    public bool Answers { get; set; }

    public SheetFilter Filter() => new(
        From,
        To,
        Clean(Age),
        Clean(Vegetable),
        Clean(Participant)?.ToUpperInvariant(),
        Book,
        Category,
        Ids(Recipes),
        Ids(Secrets));

    // True when the download is narrowed to specific people, books or items.
    public bool IsSelection =>
        Clean(Participant) is not null
        || Book is not null
        || Category is not null
        || Ids(Recipes).Count > 0
        || Ids(Secrets).Count > 0;

    // Added to file names so different downloads don't overwrite each other.
    public string NamePart(StudyWindow? study) =>
        (study is null ? "" : $"-study-{study.Number}") + (IsSelection ? "-selection" : "");

    // For the files' About tab and README.
    public string Describe(StudyWindow? study)
    {
        var f = Filter();
        var parts = new List<string>();
        if (study is not null) parts.Add(study.Describe());
        if (f.From is not null) parts.Add($"from {f.From:yyyy-MM-dd}");
        if (f.To is not null) parts.Add($"to {f.To:yyyy-MM-dd}");
        if (f.AgeRange is not null) parts.Add($"age {f.AgeRange}");
        if (f.Vegetable is not null) parts.Add($"vegetable {f.Vegetable}");
        if (f.Participant is not null) parts.Add($"research ID {f.Participant}");
        if (f.BookNo is not null) parts.Add($"book {f.BookNo}");
        if (f.Category is not null) parts.Add($"Secrets category {f.Category}");
        if (f.Recipes is { Count: > 0 } r) parts.Add($"books holding any of {r.Count} recipes");
        if (f.Secrets is { Count: > 0 } s) parts.Add($"books holding any of {s.Count} secrets");
        return parts.Count == 0 ? "none" : string.Join(", ", parts);
    }

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static List<int> Ids(string? value) =>
        (value ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(x => int.TryParse(x, out var id) ? id : (int?)null)
            .OfType<int>()
            .Distinct()
            .Take(MaxIds)
            .ToList();
}