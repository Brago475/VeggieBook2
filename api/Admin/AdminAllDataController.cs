using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;
using VeggieBook.Api.Research.Export;

namespace VeggieBook.Api.Admin;

// The admin site's All Data page.
//
//   GET /api/admin/all-data/books        file 1: one row per book
//   GET /api/admin/all-data/items        file 2: one row per recipe or
//                                        secret (answers=true repeats the
//                                        book's 0/1 answers on every row)
//   GET /api/admin/all-data/questions    every question and answer choice
//   GET /api/admin/all-data/export?format=zip|xlsx
//                                        both files: zip = Download all
//                                        (Excel, CSV, SPSS), xlsx = one
//                                        workbook with both
//   GET /api/admin/all-data/export/{books|items}?format=xlsx|csv|spss
//                                        one file by itself
//
// Filters (all optional): from and to (yyyy-MM-dd, Eastern), age, vegetable
// (a vegetable code such as BROCCOLI).
//
// Admins only. Every row is keyed by the anonymous research ID.

[ApiController]
[Route("api/admin/all-data")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminAllDataController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    [HttpGet("books")]
    public async Task<IActionResult> Books(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? age,
        [FromQuery] string? vegetable) =>
        Ok(await AllDataSheets.BooksAsync(db, content, Filter(from, to, age, vegetable)));

    [HttpGet("items")]
    public async Task<IActionResult> Items(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? age,
        [FromQuery] string? vegetable,
        [FromQuery] bool answers = false) =>
        Ok(await AllDataSheets.ItemsAsync(db, content, Filter(from, to, age, vegetable), answers));

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
        [FromQuery] string? vegetable)
    {
        var filter = Filter(from, to, age, vegetable);
        var books = await AllDataSheets.BooksAsync(db, content, filter);
        var items = await AllDataSheets.ItemsAsync(db, content, filter, withAnswers: false);
        var questions = await AllDataSource.LoadQuestionsAsync(content);
        var filters = Describe(filter);
        var stamp = books.GeneratedAt.ToString("yyyy-MM-dd");

        Response.Headers.CacheControl = "no-store";

        return format switch
        {
            "zip" or null => File(
                AllDataPackage.Build(books, items, questions, filters, stamp),
                "application/zip",
                $"veggiebook2-all-data-{stamp}.zip"),
            "xlsx" => File(
                AllDataExcel.Build(books, items, questions, filters),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"veggiebook2-all-data-{stamp}.xlsx"),
            _ => BadRequest(new { error = "Format must be zip or xlsx." })
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
        [FromQuery] bool answers = false)
    {
        var filter = Filter(from, to, age, vegetable);

        Sheet? data = sheet switch
        {
            "books" => await AllDataSheets.BooksAsync(db, content, filter),
            "items" => await AllDataSheets.ItemsAsync(db, content, filter, answers),
            _ => null
        };
        if (data is null) return NotFound(new { error = "Unknown file." });

        var filters = Describe(filter);
        var fileName = sheet == "books" ? "books" : "recipes-and-secrets";
        var baseName = $"veggiebook2-{fileName}-{data.GeneratedAt:yyyy-MM-dd}";

        Response.Headers.CacheControl = "no-store";

        return format switch
        {
            "csv" => File(CsvExport.Build(data), "text/csv; charset=utf-8", $"{baseName}.csv"),
            "xlsx" => File(ExcelExport.Build(data, filters),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{baseName}.xlsx"),
            "spss" => File(SpssExport.Build(data, filters, baseName), "application/zip", $"{baseName}-spss.zip"),
            _ => BadRequest(new { error = "Format must be xlsx, csv, or spss." })
        };
    }

    private static SheetFilter Filter(DateOnly? from, DateOnly? to, string? age, string? vegetable) =>
        new(from, to, Clean(age), Clean(vegetable));

    private static string Describe(SheetFilter f)
    {
        var parts = new List<string>();
        if (f.From is not null) parts.Add($"from {f.From:yyyy-MM-dd}");
        if (f.To is not null) parts.Add($"to {f.To:yyyy-MM-dd}");
        if (f.AgeRange is not null) parts.Add($"age {f.AgeRange}");
        if (f.Vegetable is not null) parts.Add($"vegetable {f.Vegetable}");
        return parts.Count == 0 ? "none" : string.Join(", ", parts);
    }

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}