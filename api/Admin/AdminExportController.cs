using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Admin;

// The admin site's Export page.
//
//   GET /api/admin/export/summary      counts for the chosen data
//   GET /api/admin/export/bundle?files=books,items,participants,codebook,content
//                              &formats=xlsx,csv,spss,pdf
//                                      the chosen files in one zip
//   GET /api/admin/export/studies      every study, one folder each
//   GET /api/admin/export/codebook?format=xlsx|csv
//   GET /api/admin/export/content?format=xlsx|csv
//
// Filters: see ExportQuery.cs. Same rules as All Data. Admins only.

[ApiController]
[Route("api/admin/export")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminExportController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private const string XlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static readonly string[] AllFiles = ["books", "items", "participants", "codebook", "content"];

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] ExportQuery q)
    {
        var window = await StudyWindow.FindAsync(db, q.Study);
        if (q.Study is not null && window is null) return NoStudy(q.Study.Value);

        var data = await AllDataSource.LoadAsync(db, content, q.Filter(), window);
        var dates = data.Books.Select(b => DateOnly.FromDateTime(b.Local)).ToList();

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            books = data.Books.Count,
            veggieBooks = data.Books.Count(b => b.Kind == "veggie"),
            secretsBooks = data.Books.Count(b => b.Kind == "secrets"),
            participants = data.Books.Select(b => b.Person.ParticipantId).Distinct().Count(),
            items = data.Books.Sum(b => b.Items.Count),
            from = dates.Count == 0 ? null : dates.Min().ToString("yyyy-MM-dd"),
            to = dates.Count == 0 ? null : dates.Max().ToString("yyyy-MM-dd")
        });
    }

    [HttpGet("bundle")]
    public async Task<IActionResult> Bundle(
        [FromQuery] string? files,
        [FromQuery] string? formats,
        [FromQuery] ExportQuery q)
    {
        var chosenFiles = List(files).Where(AllFiles.Contains).ToList();
        var chosenFormats = List(formats).Where(ExportBundle.Formats.Contains).ToList();
        if (chosenFiles.Count == 0 || chosenFormats.Count == 0)
            return BadRequest(new { error = "Pick at least one file and one format." });

        var window = await StudyWindow.FindAsync(db, q.Study);
        if (q.Study is not null && window is null) return NoStudy(q.Study.Value);

        var filter = q.Filter();
        var sheets = new List<Sheet>();
        Sheet? books = null;

        foreach (var file in chosenFiles)
        {
            switch (file)
            {
                case "books":
                    books = await AllDataSheets.BooksAsync(db, content, filter, window);
                    sheets.Add(books);
                    break;
                case "items":
                    sheets.Add(await AllDataSheets.ItemsAsync(db, content, filter, q.Answers, window));
                    break;
                case "participants":
                    var people = await ResearchSheets.ParticipantsAsync(db, new SheetFilter(null, null, filter.AgeRange, null));
                    if (q.IsSelection || window is not null)
                    {
                        books ??= await AllDataSheets.BooksAsync(db, content, filter, window);
                        people = OnlyPeopleIn(people, books);
                    }
                    sheets.Add(people);
                    break;
                case "codebook":
                    sheets.Add(ExportSheets.Codebook(await AllDataSource.LoadQuestionsAsync(content)));
                    break;
                case "content":
                    sheets.Add(await ExportSheets.ContentAsync(db, content, filter, window));
                    break;
            }
        }

        var stamp = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var bytes = ExportBundle.Build(sheets, chosenFormats, q.Describe(window), stamp);

        Response.Headers.CacheControl = "no-store";
        return File(bytes, "application/zip", $"veggiebook2-export{q.NamePart(window)}-{stamp}.zip");
    }

    [HttpGet("studies")]
    public async Task<IActionResult> Studies()
    {
        var numbers = await db.Studies.AsNoTracking().OrderBy(s => s.Number).Select(s => s.Number).ToListAsync();
        var questions = await AllDataSource.LoadQuestionsAsync(content);
        var noFilter = new SheetFilter(null, null, null, null);
        var studies = new List<StudyFiles>();

        foreach (var number in numbers)
        {
            var window = await StudyWindow.FindAsync(db, number);
            if (window is null) continue;

            var books = await AllDataSheets.BooksAsync(db, content, noFilter, window);
            var items = await AllDataSheets.ItemsAsync(db, content, noFilter, false, window);
            studies.Add(new StudyFiles($"study-{number}", books, items, questions, window.Describe()));
        }

        var stamp = DateTime.UtcNow.ToString("yyyy-MM-dd");

        Response.Headers.CacheControl = "no-store";
        return File(ExportBundle.Studies(studies, stamp), "application/zip", $"veggiebook2-every-study-{stamp}.zip");
    }

    [HttpGet("codebook")]
    public async Task<IActionResult> Codebook([FromQuery] string? format)
    {
        var sheet = ExportSheets.Codebook(await AllDataSource.LoadQuestionsAsync(content));
        return One(sheet, format, "none", "question-codebook");
    }

    [HttpGet("content")]
    public async Task<IActionResult> Content([FromQuery] string? format, [FromQuery] ExportQuery q)
    {
        var window = await StudyWindow.FindAsync(db, q.Study);
        if (q.Study is not null && window is null) return NoStudy(q.Study.Value);

        var sheet = await ExportSheets.ContentAsync(db, content, q.Filter(), window);
        return One(sheet, format, q.Describe(window), $"content-library{q.NamePart(window)}");
    }

    private IActionResult One(Sheet sheet, string? format, string filters, string stem)
    {
        var baseName = $"veggiebook2-{stem}-{sheet.GeneratedAt:yyyy-MM-dd}";
        Response.Headers.CacheControl = "no-store";

        return format switch
        {
            "csv" => File(CsvExport.Build(sheet), "text/csv; charset=utf-8", $"{baseName}.csv"),
            "xlsx" or null => File(ExcelExport.Build(sheet, filters), XlsxType, $"{baseName}.xlsx"),
            _ => BadRequest(new { error = "Format must be xlsx or csv." })
        };
    }

    // Keeps only participants who have a book in the chosen data.
    private static Sheet OnlyPeopleIn(Sheet people, Sheet books)
    {
        if (!people.Columns.Any(c => c.Key == "participant_id")) return people;

        var ids = books.Rows
            .Select(r => r.GetValueOrDefault("participant_id") as string)
            .OfType<string>()
            .ToHashSet();

        return people with
        {
            Rows = people.Rows
                .Where(r => r.GetValueOrDefault("participant_id") is string id && ids.Contains(id))
                .ToList()
        };
    }

    private static List<string> List(string? value) =>
        (value ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(x => x.ToLowerInvariant())
            .Distinct()
            .ToList();

    private NotFoundObjectResult NoStudy(int number) =>
        NotFound(new { error = $"There is no Study {number}." });
}