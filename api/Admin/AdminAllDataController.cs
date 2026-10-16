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
//   GET /api/admin/all-data/items        file 2: one row per recipe or secret
//   GET /api/admin/all-data/questions    every question and answer choice
//   GET /api/admin/all-data/export?format=xlsx|pdf|csv|spss|zip
//                                        both files together
//   GET /api/admin/all-data/export/{books|items}?format=xlsx|csv|spss
//                                        one file by itself
//
// Filters: see ExportQuery.cs. A study that doesn't exist gives 404.
// Admins only. Every row is keyed by the anonymous research ID.

[ApiController]
[Route("api/admin/all-data")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminAllDataController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private const string XlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    [HttpGet("books")]
    public async Task<IActionResult> Books([FromQuery] ExportQuery q)
    {
        var window = await StudyWindow.FindAsync(db, q.Study);
        if (q.Study is not null && window is null) return NoStudy(q.Study.Value);

        return Ok(await AllDataSheets.BooksAsync(db, content, q.Filter(), window));
    }

    [HttpGet("items")]
    public async Task<IActionResult> Items([FromQuery] ExportQuery q)
    {
        var window = await StudyWindow.FindAsync(db, q.Study);
        if (q.Study is not null && window is null) return NoStudy(q.Study.Value);

        return Ok(await AllDataSheets.ItemsAsync(db, content, q.Filter(), q.Answers, window));
    }

    [HttpGet("questions")]
    public async Task<IActionResult> Questions() =>
        Ok(await AllDataSource.LoadQuestionsAsync(content));

    // Both files together.
    [HttpGet("export")]
    public async Task<IActionResult> ExportAll([FromQuery] string? format, [FromQuery] ExportQuery q)
    {
        var window = await StudyWindow.FindAsync(db, q.Study);
        if (q.Study is not null && window is null) return NoStudy(q.Study.Value);

        var filter = q.Filter();
        var books = await AllDataSheets.BooksAsync(db, content, filter, window);
        var items = await AllDataSheets.ItemsAsync(db, content, filter, q.Answers, window);
        var questions = await AllDataSource.LoadQuestionsAsync(content);
        var filters = q.Describe(window);
        var stamp = books.GeneratedAt.ToString("yyyy-MM-dd");
        var baseName = $"veggiebook2-all-data{q.NamePart(window)}-{stamp}";

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
    public async Task<IActionResult> ExportOne(string sheet, [FromQuery] string? format, [FromQuery] ExportQuery q)
    {
        var window = await StudyWindow.FindAsync(db, q.Study);
        if (q.Study is not null && window is null) return NoStudy(q.Study.Value);

        var filter = q.Filter();

        Sheet? data = sheet switch
        {
            "books" => await AllDataSheets.BooksAsync(db, content, filter, window),
            "items" => await AllDataSheets.ItemsAsync(db, content, filter, q.Answers, window),
            _ => null
        };
        if (data is null) return NotFound(new { error = "Unknown file." });

        var filters = q.Describe(window);
        var fileName = sheet == "books" ? "books" : "recipes-and-secrets";
        var baseName = $"veggiebook2-{fileName}{q.NamePart(window)}-{data.GeneratedAt:yyyy-MM-dd}";

        Response.Headers.CacheControl = "no-store";

        return format switch
        {
            "csv" => File(CsvExport.Build(data), "text/csv; charset=utf-8", $"{baseName}.csv"),
            "xlsx" => File(ExcelExport.Build(data, filters), XlsxType, $"{baseName}.xlsx"),
            "spss" => File(SpssExport.Build(data, filters, baseName), "application/zip", $"{baseName}-spss.zip"),
            "pdf" => File(PdfExport.Build(data, filters), "application/pdf", $"{baseName}.pdf"),
            _ => BadRequest(new { error = "Format must be xlsx, csv, spss, or pdf." })
        };
    }

    private NotFoundObjectResult NoStudy(int number) =>
        NotFound(new { error = $"There is no Study {number}." });
}