namespace VeggieBook.Api.Research;

// The shape every research sheet shares: columns, then rows.
//
// The admin page, and the Excel, CSV, SPSS, and PDF exports, are all made
// from a Sheet, so they always show exactly the same data.
//
// Column keys are short snake_case names (participant_id, q1) that also
// work as SPSS variable names. Each column carries its label, its type,
// and, for columns with a fixed set of answers, those answers: together
// that is the codebook.

// Type is one of: text, number, date, time.
public record SheetColumn(
    string Key,
    string Label,
    string Type,
    IReadOnlyList<string>? Values = null);

public record Sheet(
    string Name,
    string Title,
    DateTime GeneratedAt,
    IReadOnlyList<SheetColumn> Columns,
    IReadOnlyList<Dictionary<string, object?>> Rows);

// Filters from the page. Dates are local (Eastern) calendar days. Null
// means "no filter" for each one.
public record SheetFilter(
    DateOnly? From,
    DateOnly? To,
    string? AgeRange,
    string? Vegetable);