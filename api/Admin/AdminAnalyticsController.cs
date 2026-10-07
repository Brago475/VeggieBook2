using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Totals and charts for the admin site's Analytics screen.
//
//   GET /api/admin/analytics
//
// Admins only (Roles.AdminPolicy). Built only from data the app already
// keeps to work: accounts and their saved books. Nothing new is recorded.
// Study tracking (time per question and so on) is separate and stays off
// until the IRB is approved.
//
// Real accounts only. Guests are left out, since they are deleted within a
// day and would make the numbers move for no reason.
//
// No account appears here: every number is a count or an average across
// accounts. No email, name, or uploaded photo is read.
//
// The books are loaded once and counted in memory. That is simple and fast
// at this app's size (hundreds of accounts). If it ever grows to many
// thousands, move the counting into SQL.

[ApiController]
[Route("api/admin/analytics")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminAnalyticsController(AccountsContext db, VeggieBookContext content)
    : ControllerBase
{
    private const int Weeks = 12;
    private const int TopCount = 10;
    private const int TopCovers = 8;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        // ---- Data from the accounts database ----

        var users = await db.Users
            .AsNoTracking()
            .Where(u => u.GuestExpiresAt == null)
            .Select(u => new { u.Id, u.CreatedAt, u.AgeRange })
            .ToListAsync();

        var books = await db.Books
            .AsNoTracking()
            .Where(b => db.Users.Any(u => u.Id == b.UserId && u.GuestExpiresAt == null))
            .Select(b => new
            {
                b.UserId,
                b.Kind,
                b.Language,
                b.VegetableCode,
                b.SecretCategoryId,
                b.CoverPath,
                HasUpload = b.CoverUpload != null,
                b.CreatedAt,
                Attributes = b.Attributes.Select(a => a.Attribute).ToList(),
                Selections = b.Selections
                    .Select(s => new { s.ContentType, s.ContentId, s.Kept, s.ExtraCopies })
                    .ToList()
            })
            .ToListAsync();

        var veggieBooks = books.Where(b => b.Kind == "veggie").ToList();
        var secretsBooks = books.Where(b => b.Kind == "secrets").ToList();
        var selections = books.SelectMany(b => b.Selections).ToList();
        var recipeSel = selections.Where(s => s.ContentType == "recipe").ToList();
        var secretSel = selections.Where(s => s.ContentType == "secret").ToList();

        // ---- Activity by week (weeks start on Monday, UTC) ----

        var thisWeek = WeekStart(DateTime.UtcNow);
        var weeks = Enumerable.Range(0, Weeks)
            .Select(i => thisWeek.AddDays(-7 * (Weeks - 1 - i)))
            .Select(start =>
            {
                var end = start.AddDays(7);
                return new
                {
                    week = start,
                    signups = users.Count(u => u.CreatedAt >= start && u.CreatedAt < end),
                    veggieBooks = veggieBooks.Count(b => b.CreatedAt >= start && b.CreatedAt < end),
                    secretsBooks = secretsBooks.Count(b => b.CreatedAt >= start && b.CreatedAt < end)
                };
            })
            .ToList();

        // ---- Vegetables and Secrets categories picked ----

        var vegCounts = veggieBooks
            .Where(b => b.VegetableCode != null)
            .GroupBy(b => b.VegetableCode!)
            .ToDictionary(g => g.Key, g => g.Count());

        var allVegetables = await content.Vegetables
            .AsNoTracking()
            .OrderBy(v => v.SortOrder)
            .Select(v => new { v.Code, v.NameEn, v.ImagePath, v.Active })
            .ToListAsync();

        // Every active vegetable is listed, including ones never picked, so
        // a zero is visible. A retired one is listed only if a book has it.
        var vegetables = allVegetables
            .Where(v => v.Active || vegCounts.ContainsKey(v.Code))
            .Select(v => new
            {
                code = v.Code,
                name = v.NameEn,
                image = v.ImagePath,
                books = vegCounts.GetValueOrDefault(v.Code)
            })
            .OrderByDescending(v => v.books)
            .ThenBy(v => v.name)
            .ToList();

        var categoryCounts = secretsBooks
            .Where(b => b.SecretCategoryId != null)
            .GroupBy(b => b.SecretCategoryId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());

        var secretCategories = (await content.SecretCategories
                .AsNoTracking()
                .OrderBy(c => c.SortOrder)
                .Select(c => new { c.Id, c.NameEn, c.ImagePath })
                .ToListAsync())
            .Select(c => new
            {
                id = c.Id,
                name = c.NameEn,
                image = c.ImagePath,
                books = categoryCounts.GetValueOrDefault(c.Id)
            })
            .OrderByDescending(c => c.books)
            .ThenBy(c => c.name)
            .ToList();

        // ---- Covers ----

        var topCovers = books
            .Where(b => !b.HasUpload && !string.IsNullOrEmpty(b.CoverPath))
            .GroupBy(b => b.CoverPath!)
            .Select(g => new { path = g.Key, books = g.Count() })
            .OrderByDescending(c => c.books)
            .Take(TopCovers)
            .ToList();

        // ---- Most kept recipes and secrets ----

        var topRecipeIds = recipeSel
            .Where(s => s.Kept)
            .GroupBy(s => s.ContentId)
            .OrderByDescending(g => g.Count())
            .Take(TopCount)
            .Select(g => g.Key)
            .ToArray();

        var recipeInfo = await content.Recipes
            .AsNoTracking()
            .Where(r => topRecipeIds.Contains(r.Id))
            .Select(r => new
            {
                r.Id,
                r.DisplayCode,
                r.TitleEn,
                Photo = content.RecipePhotos
                    .Where(p => p.RecipeId == r.Id)
                    .OrderBy(p => p.Position)
                    .Select(p => p.ImagePath)
                    .FirstOrDefault()
            })
            .ToDictionaryAsync(r => r.Id);

        var topRecipes = topRecipeIds
            .Select(id => new
            {
                id,
                code = recipeInfo.GetValueOrDefault(id)?.DisplayCode,
                title = recipeInfo.GetValueOrDefault(id)?.TitleEn ?? $"Recipe {id}",
                photo = recipeInfo.GetValueOrDefault(id)?.Photo,
                kept = recipeSel.Count(s => s.ContentId == id && s.Kept),
                removed = recipeSel.Count(s => s.ContentId == id && !s.Kept)
            })
            .ToList();

        var topSecretIds = secretSel
            .Where(s => s.Kept)
            .GroupBy(s => s.ContentId)
            .OrderByDescending(g => g.Count())
            .Take(TopCount)
            .Select(g => g.Key)
            .ToArray();

        var secretInfo = await content.Secrets
            .AsNoTracking()
            .Where(s => topSecretIds.Contains(s.Id))
            .Select(s => new { s.Id, s.DisplayNumber, s.HeadlineEn, s.ImagePathEn })
            .ToDictionaryAsync(s => s.Id);

        var topSecrets = topSecretIds
            .Select(id => new
            {
                id,
                number = secretInfo.GetValueOrDefault(id)?.DisplayNumber,
                title = secretInfo.GetValueOrDefault(id)?.HeadlineEn ?? $"Secret {id}",
                image = secretInfo.GetValueOrDefault(id)?.ImagePathEn,
                kept = secretSel.Count(s => s.ContentId == id && s.Kept),
                removed = secretSel.Count(s => s.ContentId == id && !s.Kept)
            })
            .ToList();

        // ---- Age ranges ----

        var ageRanges = users
            .GroupBy(u => string.IsNullOrEmpty(u.AgeRange) ? "Not given" : u.AgeRange)
            .Select(g => new { label = g.Key, accounts = g.Count() })
            .OrderBy(a => a.label == "Not given")
            .ThenBy(a => a.label)
            .ToList();

        // ---- Answers to each question ----
        // A VeggieBook can pick several answers per question, so each
        // percentage is out of all VeggieBooks and they can add up to more
        // than 100.

        var answerCounts = veggieBooks
            .SelectMany(b => b.Attributes)
            .GroupBy(a => a)
            .ToDictionary(g => g.Key, g => g.Count());

        var questionData = await content.Questions
            .AsNoTracking()
            .OrderBy(q => q.OrderPriority)
            .Select(q => new
            {
                q.Id,
                q.Mnemonic,
                q.IntroEn,
                q.IsHidden,
                Choices = q.Choices
                    .OrderBy(c => c.SortOrder)
                    .Select(c => new { c.Attribute, c.TextEn })
                    .ToList()
            })
            .ToListAsync();

        var questions = questionData
            .Select(q => new
            {
                id = q.Id,
                code = q.Mnemonic,
                text = QuestionText(q.IntroEn, q.Mnemonic),
                hidden = q.IsHidden,
                choices = q.Choices
                    .Select(c =>
                    {
                        var count = answerCounts.GetValueOrDefault(c.Attribute);
                        return new
                        {
                            attribute = c.Attribute,
                            text = c.TextEn,
                            count,
                            percent = Percent(count, veggieBooks.Count)
                        };
                    })
                    .ToList()
            })
            .ToList();

        // ---- Descriptive statistics ----

        var booksPerUser = books
            .GroupBy(b => b.UserId)
            .ToDictionary(g => g.Key, g => g.Count());

        var descriptives = new[]
        {
            Descriptives.Of("Recipes per VeggieBook",
                veggieBooks.Select(b => (double)b.Selections.Count(s => s.ContentType == "recipe" && s.Kept))),
            Descriptives.Of("Secrets per Secrets Book",
                secretsBooks.Select(b => (double)b.Selections.Count(s => s.ContentType == "secret" && s.Kept))),
            Descriptives.Of("Answers per VeggieBook",
                veggieBooks.Select(b => (double)b.Attributes.Count)),
            Descriptives.Of("Books per account",
                users.Select(u => (double)booksPerUser.GetValueOrDefault(u.Id))),
            Descriptives.Of("Extra copies per book",
                books.Select(b => (double)b.Selections.Where(s => s.Kept).Sum(s => s.ExtraCopies)))
        };

        return Ok(new
        {
            generatedAt = DateTime.UtcNow,
            summary = new
            {
                accounts = users.Count,
                veggieBooks = veggieBooks.Count,
                secretsBooks = secretsBooks.Count,
                personalCovers = books.Count(b => b.HasUpload),
                builtInCovers = books.Count(b => !b.HasUpload),
                englishBooks = books.Count(b => b.Language != "es"),
                spanishBooks = books.Count(b => b.Language == "es"),
                recipesKept = recipeSel.Count(s => s.Kept),
                recipesRemoved = recipeSel.Count(s => !s.Kept),
                secretsKept = secretSel.Count(s => s.Kept),
                secretsRemoved = secretSel.Count(s => !s.Kept),
                extraCopies = selections.Where(s => s.Kept).Sum(s => s.ExtraCopies)
            },
            weeks,
            vegetables,
            secretCategories,
            topCovers,
            topRecipes,
            topSecrets,
            ageRanges,
            questions,
            descriptives
        });
    }

    private static DateTime WeekStart(DateTime d)
    {
        var daysSinceMonday = ((int)d.DayOfWeek + 6) % 7;
        return d.Date.AddDays(-daysSinceMonday);
    }

    private static double Percent(int count, int total) =>
        total == 0 ? 0 : Math.Round(100.0 * count / total, 1);

    // The question text has %s where the app puts the vegetable's name.
    private static string QuestionText(string? intro, string mnemonic) =>
        string.IsNullOrWhiteSpace(intro) ? mnemonic : intro.Replace("%s", "the vegetable");
}