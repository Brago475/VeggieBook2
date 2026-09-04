using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Controllers;

// Language handling: every endpoint takes ?lang=en|es and returns text in that
// language only, rather than shipping both and letting the client choose. The
// bilingual pair stays in the database; the API speaks one language per
// request. That halves payload size and keeps language logic in one place.

public static class Lang
{
    public static bool IsSpanish(string? lang) =>
        string.Equals(lang, "es", StringComparison.OrdinalIgnoreCase);

    public static string? Pick(string? lang, string? en, string? es) =>
        IsSpanish(lang) ? es : en;
}

[ApiController]
[Route("api/vegetables")]
public class VegetablesController(VeggieBookContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? lang)
    {
        var rows = await db.Vegetables
            .Where(v => v.Active)
            .OrderBy(v => v.SortOrder)
            .Select(v => new
            {
                code = v.Code,
                shortCode = v.ShortCode,
                name = Lang.IsSpanish(lang) ? v.NameEs : v.NameEn,
                image = v.ImagePath,
                recipeCount = v.Recipes.Count(r => r.Active)
            })
            .ToListAsync();

        return Ok(rows);
    }
}

[ApiController]
[Route("api/questions")]
public class QuestionsController(VeggieBookContext db) : ControllerBase
{
    // Returns the five visible profiling screens in order. The hidden question
    // is excluded: its attributes (ALL_USERS, Serving) are added server-side
    // during matching, not chosen by the user.
    //
    // Intro text contains a %s placeholder for the vegetable name. If a
    // vegetable code is supplied, it is substituted here so the client does
    // not have to know about the placeholder.
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? lang,
        [FromQuery] string? vegetable)
    {
        string? name = null;
        if (!string.IsNullOrWhiteSpace(vegetable))
        {
            var veg = await db.Vegetables
                .FirstOrDefaultAsync(v => v.Code == vegetable);
            if (veg is null) return NotFound(new { error = "Unknown vegetable" });
            name = Lang.Pick(lang, veg.NameEn, veg.NameEs);
        }

        var questions = await db.Questions
            .Where(q => !q.IsHidden)
            .OrderBy(q => q.Phase).ThenBy(q => q.OrderPriority)
            .Select(q => new
            {
                id = q.Id,
                mnemonic = q.Mnemonic,
                intro = Lang.IsSpanish(lang) ? q.IntroEs : q.IntroEn,
                subIntro = Lang.IsSpanish(lang) ? q.SubIntroEs : q.SubIntroEn,
                choices = q.Choices
                    .OrderBy(c => c.SortOrder)
                    .Select(c => new
                    {
                        id = c.Id,
                        attribute = c.Attribute,
                        text = Lang.IsSpanish(lang) ? c.TextEs : c.TextEn,
                        isDefault = c.IsDefault
                    })
                    .ToList()
            })
            .ToListAsync();

        if (name is null) return Ok(questions);

        // Substitute the vegetable name into the %s placeholders.
        var filled = questions.Select(q => new
        {
            q.id,
            q.mnemonic,
            intro = q.intro?.Replace("%s", name),
            subIntro = q.subIntro?.Replace("%s", name),
            choices = q.choices.Select(c => new
            {
                c.id,
                c.attribute,
                text = c.text.Replace("%s", name),
                c.isDefault
            })
        });

        return Ok(filled);
    }
}

public record MatchRequest(string Vegetable, string[] Attributes, string? Lang);

[ApiController]
[Route("api/match")]
public class MatchController(VeggieBookContext db) : ControllerBase
{
    // The matching engine.
    //
    // A recipe matches when EVERY attribute it requires is in the user's
    // selected set. A tip matches when its single attribute is in that set.
    //
    // ALL_USERS and Serving come from the hidden question and are always
    // added, which is what makes the baseline recipes appear for everyone.
    [HttpPost]
    public async Task<IActionResult> Post([FromBody] MatchRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Vegetable))
            return BadRequest(new { error = "vegetable is required" });

        var veg = await db.Vegetables
            .FirstOrDefaultAsync(v => v.Code == req.Vegetable);
        if (veg is null) return NotFound(new { error = "Unknown vegetable" });

        var selected = (req.Attributes ?? [])
            .Concat(["ALL_USERS", "Serving"])
            .Distinct()
            .ToArray();

        var es = Lang.IsSpanish(req.Lang);

        var recipes = await db.Recipes
            .Where(r => r.VegetableCode == req.Vegetable && r.Active)
            .Where(r => !r.Attributes.Any(a => !selected.Contains(a.Attribute)))
            // Codeless recipes sort last rather than mixing into the
            // alphabetical run, since "212" would sort before "BR-202".
            .OrderBy(r => r.DisplayCode == null)
            .ThenBy(r => r.DisplayCode)
            .ThenBy(r => r.Id)
            .Select(r => new
            {
                id = r.Id,
                code = r.DisplayCode,
                title = es ? r.TitleEs : r.TitleEn,
                timeToPrepare = es ? r.TimeToPrepareEs : r.TimeToPrepareEn,
                timeToCook = es ? r.TimeToCookEs : r.TimeToCookEn,
                servings = es ? r.ServingsEs : r.ServingsEn,
                photo = r.Photos.OrderBy(p => p.Position)
                                .Select(p => p.ImagePath).FirstOrDefault(),
                badges = r.Annotations
                    .Where(a => selected.Contains(a.DisplayedIf))
                    .Select(a => new
                    {
                        text = es ? a.TextEs : a.TextEn,
                        color = a.Color
                    })
                    .ToList()
            })
            .ToListAsync();

        var tips = await db.Tips
            .Where(t => t.VegetableCode == req.Vegetable)
            .Where(t => selected.Contains(t.Attribute))
            .OrderBy(t => t.SortOrder)
            .Select(t => new
            {
                id = t.Id,
                heading = es ? t.HeadingEs : t.HeadingEn,
                blocks = t.Blocks
                    .OrderBy(x => x.Position)
                    .Select(x => new
                    {
                        text = es ? x.TextEs : x.TextEn,
                        image = x.ImagePath
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            vegetable = new
            {
                code = veg.Code,
                name = es ? veg.NameEs : veg.NameEn
            },
            recipeCount = recipes.Count,
            tipCount = tips.Count,
            recipes,
            tips
        });
    }
}

[ApiController]
[Route("api/recipes")]
public class RecipesController(VeggieBookContext db) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, [FromQuery] string? lang)
    {
        var es = Lang.IsSpanish(lang);

        var recipe = await db.Recipes
            .Where(r => r.Id == id)
            .Select(r => new
            {
                id = r.Id,
                code = r.DisplayCode,
                vegetable = r.VegetableCode,
                title = es ? r.TitleEs : r.TitleEn,
                storyLine = es ? r.StoryLineEs : r.StoryLineEn,
                timeToPrepare = es ? r.TimeToPrepareEs : r.TimeToPrepareEn,
                timeToCook = es ? r.TimeToCookEs : r.TimeToCookEn,
                servings = es ? r.ServingsEs : r.ServingsEn,
                canBeMadeAhead = es ? r.CanBeMadeAheadEs : r.CanBeMadeAheadEn,
                canBeFrozen = es ? r.CanBeFrozenEs : r.CanBeFrozenEn,
                goodForLeftovers = es ? r.GoodForLeftoversEs
                                      : r.GoodForLeftoversEn,
                ingredients = r.Ingredients.OrderBy(x => x.Position)
                    .Select(x => es ? x.TextEs : x.TextEn).ToList(),
                steps = r.Steps.OrderBy(x => x.Position)
                    .Select(x => es ? x.TextEs : x.TextEn).ToList(),
                notes = r.Notes.OrderBy(x => x.Position)
                    .Select(x => es ? x.TextEs : x.TextEn).ToList(),
                photos = r.Photos.OrderBy(x => x.Position)
                    .Select(x => x.ImagePath).ToList()
            })
            .FirstOrDefaultAsync();

        return recipe is null ? NotFound() : Ok(recipe);
    }
}
