using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Admin;

// The admin site's All Data page, and the data of one study on the Studies
// page.
//
//   GET /api/admin/all-data/books        file 1: one row per book
//   GET /api/admin/all-data/items        file 2: one row per recipe or
//                                        secret (answers=true repeats the
//                                        book's 0/1 answers on every row)
//   GET /api/admin/all-data/questions    every question and answer choice
//   GET /api/admin/all-data/export?format=xlsx|pdf|csv|spss|zip
//                                        both files together, with column
//                                        names in words:
//                                          xlsx  one workbook with both
//                                          pdf   one PDF with both
//                                          csv   a zip of two CSV files
//                                          spss  a zip ready for SPSS, with
//                                                every label set
//                                          zip   everything (Excel, CSV,
//                                                SPSS, README)
//                                        answers=true adds the book's
//                                        answers to the recipe rows
//   GET /api/admin/all-data/export/{books|items}?format=xlsx|csv|spss
//                                        one file by itself (short names)
//
// Filters (all optional): from and to (yyyy-MM-dd, Eastern), age, vegetable
// (a vegetable code such as BROCCOLI), and study (a study number such as 3:
// only books saved while that study ran, by people whose tracking was on
// at that moment; see Research/AllData/AllDataStudy.cs). A study that
// doesn't exist gives 404.
//
// Admins only. Every row is keyed by the anonymous research ID.

[ApiController]
[Route("api/admin/all-data")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminAllDataController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private const string XlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    [HttpGet("books")]
    public async Task<IActionResult> Books(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? age,
        [FromQuery] string? vegetable,
        [FromQuery] int? study)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null) return NoStudy(study.Value);

        return Ok(await AllDataSheets.BooksAsync(db, content, Filter(from, to, age, vegetable), window));
    }

    [HttpGet("items")]
    public async Task<IActionResult> Items(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? age,
        [FromQuery] string? vegetable,
        [FromQuery] int? study,
        [FromQuery] bool answers = false)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null) return NoStudy(study.Value);

        return Ok(await AllDataSheets.ItemsAsync(db, content, Filter(from, to, age, vegetable), answers, window));
    }

    [HttpGet("questions")]
    public async Task<IActionResult> Questions() =>
        Ok(await AllDataSource.LoadQuestionsAsync(content));

    // Both files together.
    [HttpGet("export")]
    public async Task<IActionResult> ExportAll(
        [FromQuery] string? format,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? age,
        [FromQuery] string? vegetable,
        [FromQuery] int? study,
        [FromQuery] bool answers = false)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null) return NoStudy(study.Value);

        var filter = Filter(from, to, age, vegetable);
        var books = await AllDataSheets.BooksAsync(db, content, filter, window);
        var items = await AllDataSheets.ItemsAsync(db, content, filter, answers, window);
        var questions = await AllDataSource.LoadQuestionsAsync(content);
        var filters = Describe(filter, window);
        var stamp = books.GeneratedAt.ToString("yyyy-MM-dd");
        var baseName = $"veggiebook2-all-data{StudyPart(window)}-{stamp}";

        Response.Headers.CacheControl = "no-store";

        return format switch
        {
            "xlsx" or null => File(
                AllDataExcel.Build(books, items, questions, filters), XlsxType, $"{baseName}.xlsx"),
            "pdf" => File(AllDataFiles.Pdf(books, items, questions, filters), "application/pdf", $"{baseName}.pdf"),
            "csv" => File(AllDataFiles.Csv(books, items, questions), "application/zip", $"{baseName}-csv.zip"),
            "spss" => File(
                AllDataFiles.Spss(books, items, questions, filters, stamp), "application/zip", $"{baseName}-spss.zip"),
            "zip" => File(
                AllDataPackage.Build(books, items, questions, filters, stamp),
                "application/zip",
                $"{baseName}.zip"),
            _ => BadRequest(new { error = "Format must be xlsx, pdf, csv, spss, or zip." })
        };
    }

    // One file by itself.
    [HttpGet("export/{sheet}")]
    public async Task<IActionResult> ExportOne(
        string sheet,
        [FromQuery] string? format,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? age,
        [FromQuery] string? vegetable,
        [FromQuery] int? study,
        [FromQuery] bool answers = false)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null) return NoStudy(study.Value);

        var filter = Filter(from, to, age, vegetable);

        Sheet? data = sheet switch
        {
            "books" => await AllDataSheets.BooksAsync(db, content, filter, window),
            "items" => await AllDataSheets.ItemsAsync(db, content, filter, answers, window),
            _ => null
        };
        if (data is null) return NotFound(new { error = "Unknown file." });

        var filters = Describe(filter, window);
        var fileName = sheet == "books" ? "books" : "recipes-and-secrets";
        var baseName = $"veggiebook2-{fileName}{StudyPart(window)}-{data.GeneratedAt:yyyy-MM-dd}";

        Response.Headers.CacheControl = "no-store";

        return format switch
        {
            "csv" => File(CsvExport.Build(data), "text/csv; charset=utf-8", $"{baseName}.csv"),
            "xlsx" => File(ExcelExport.Build(data, filters), XlsxType, $"{baseName}.xlsx"),
            "spss" => File(SpssExport.Build(data, filters, baseName), "application/zip", $"{baseName}-spss.zip"),
            _ => BadRequest(new { error = "Format must be xlsx, csv, or spss." })
        };
    }

    private NotFoundObjectResult NoStudy(int number) =>
        NotFound(new { error = $"There is no Study {number}." });

    private static SheetFilter Filter(DateOnly? from, DateOnly? to, string? age, string? vegetable) =>
        new(from, to, Clean(age), Clean(vegetable));

    private static string Describe(SheetFilter f, StudyWindow? study)
    {
        var parts = new List<string>();
        if (study is not null) parts.Add(study.Describe());
        if (f.From is not null) parts.Add($"from {f.From:yyyy-MM-dd}");
        if (f.To is not null) parts.Add($"to {f.To:yyyy-MM-dd}");
        if (f.AgeRange is not null) parts.Add($"age {f.AgeRange}");
        if (f.Vegetable is not null) parts.Add($"vegetable {f.Vegetable}");
        return parts.Count == 0 ? "none" : string.Join(", ", parts);
    }

    // "-study-3" in file names, so downloads from different studies don't
    // overwrite each other.
    private static string StudyPart(StudyWindow? study) =>
        study is null ? "" : $"-study-{study.Number}";

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}