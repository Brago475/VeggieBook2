using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Admin;

/// <summary>
/// Data for the admin Question Analytics page.
///
///   GET /api/admin/question-analytics?study={number}
///
/// Returns one anonymous row per tracked book plus the question, vegetable,
/// category, recipe, and secret lookups. All aggregation (filters, answer
/// shares, comparisons, statistics) happens client-side.
///
/// Scope matches All Data (AllDataSource): tracked books only, no admin or
/// guest accounts. Rows carry a per-response participant index instead of a
/// research ID, so no identifier leaves this endpoint.
/// </summary>
[ApiController]
[Route("api/admin/question-analytics")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminQuestionAnalyticsController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private static readonly SheetFilter NoFilter = new(null, null, null, null);

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? study)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null)
            return NotFound(new { error = $"There is no Study {study}. It may have been deleted." });

        var data = await AllDataSource.LoadAsync(db, content, NoFilter, window);
        var questions = await AllDataSource.LoadQuestionsAsync(content);

        var participant = data.Books
            .Select(b => b.Person.UserId)
            .Distinct()
            .Select((id, i) => (id, i))
            .ToDictionary(x => x.id, x => x.i);

        var books = data.Books.Select(b => new
        {
            p = participant[b.Person.UserId],
            kind = b.Kind,
            language = b.Language,
            ageRange = b.Person.AgeRange,
            vegetableCode = b.VegetableCode,
            secretCategoryId = b.SecretCategoryId,
            week = WeekStart(b.Local).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            personalCover = b.HasUpload,
            answers = b.Attributes.ToList(),
            kept = b.Items.Where(i => i.Kept).Select(i => i.Id).ToList(),
            removed = b.Items.Where(i => !i.Kept).Select(i => i.Id).ToList(),
            extraCopies = b.Items.Where(i => i.Kept).Sum(i => i.ExtraCopies)
        }).ToList();

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .OrderBy(v => v.SortOrder)
            .Select(v => new { code = v.Code, name = v.NameEn, image = v.ImagePath, active = v.Active })
            .ToListAsync();

        var categories = await content.SecretCategories
            .AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .Select(c => new { id = c.Id, name = c.NameEn, image = c.ImagePath })
            .ToListAsync();

        // Lookups only for items that appear in the returned books.
        var recipeIds = data.Books.Where(b => b.Kind == "veggie").SelectMany(b => b.Items).Select(i => i.Id).ToHashSet();
        var secretIds = data.Books.Where(b => b.Kind == "secrets").SelectMany(b => b.Items).Select(i => i.Id).ToHashSet();

        var recipes = data.Content.Recipes
            .Where(r => recipeIds.Contains(r.Key))
            .ToDictionary(r => r.Key.ToString(CultureInfo.InvariantCulture),
                r => new { code = r.Value.Code, title = r.Value.Title, image = r.Value.Image });

        var secrets = data.Content.Secrets
            .Where(s => secretIds.Contains(s.Key))
            .ToDictionary(s => s.Key.ToString(CultureInfo.InvariantCulture),
                s => new { code = s.Value.Code, title = s.Value.Title, image = s.Value.Image });

        Response.Headers.CacheControl = "no-store";

        return Ok(new
        {
            questions = questions.Select(q => new
            {
                no = q.No,
                text = q.Label,
                choices = q.Choices.Select(c => new { attribute = c.Attribute, text = c.Text }).ToList()
            }),
            vegetables,
            categories,
            recipes,
            secrets,
            books
        });
    }

    private static DateTime WeekStart(DateTime d) =>
        d.Date.AddDays(-(((int)d.DayOfWeek + 6) % 7));
}