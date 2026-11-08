using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Playlists;

// Turns playlist items into what the app and the admin preview show, in one
// language and in the playlist's order. Retired recipes and content that no
// longer exists are left out.

public sealed record PlaylistRef(string Kind, int Id);

public static class PlaylistContent
{
    public static async Task<List<object>> LoadAsync(
        VeggieBookContext content,
        IReadOnlyList<PlaylistRef> refs,
        string? lang)
    {
        var es = Lang.IsSpanish(lang);
        var recipeIds = refs.Where(r => r.Kind == PlaylistKinds.Recipe).Select(r => r.Id).Distinct().ToArray();
        var tipIds = refs.Where(r => r.Kind == PlaylistKinds.Tip).Select(r => r.Id).Distinct().ToArray();

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Select(v => new { v.Code, Name = es ? v.NameEs : v.NameEn })
            .ToDictionaryAsync(v => v.Code, v => v.Name);

        var recipes = await content.Recipes
            .AsNoTracking()
            .Where(r => recipeIds.Contains(r.Id) && r.Active)
            .Select(r => new
            {
                r.Id,
                Code = r.DisplayCode,
                r.VegetableCode,
                Title = es ? r.TitleEs : r.TitleEn,
                TimeToPrepare = es ? r.TimeToPrepareEs : r.TimeToPrepareEn,
                TimeToCook = es ? r.TimeToCookEs : r.TimeToCookEn,
                Servings = es ? r.ServingsEs : r.ServingsEn,
                Photos = r.Photos.OrderBy(p => p.Position).Select(p => p.ImagePath).ToList()
            })
            .ToDictionaryAsync(r => r.Id);

        var tips = await content.Tips
            .AsNoTracking()
            .Where(t => tipIds.Contains(t.Id))
            .Select(t => new
            {
                t.Id,
                t.VegetableCode,
                Heading = es ? t.HeadingEs : t.HeadingEn,
                Blocks = t.Blocks
                    .OrderBy(b => b.Position)
                    .Select(b => new { text = es ? b.TextEs : b.TextEn, image = b.ImagePath })
                    .ToList()
            })
            .ToDictionaryAsync(t => t.Id);

        string NameOf(string code) => vegetables.GetValueOrDefault(code, code);

        var items = new List<object>();
        foreach (var r in refs)
        {
            if (r.Kind == PlaylistKinds.Recipe && recipes.TryGetValue(r.Id, out var recipe))
            {
                items.Add(new
                {
                    kind = PlaylistKinds.Recipe,
                    id = recipe.Id,
                    vegetable = recipe.VegetableCode,
                    vegetableName = NameOf(recipe.VegetableCode),
                    code = recipe.Code,
                    title = recipe.Title,
                    timeToPrepare = recipe.TimeToPrepare,
                    timeToCook = recipe.TimeToCook,
                    servings = recipe.Servings,
                    photo = RecipePhotos.Finished(recipe.Photos)
                });
            }
            else if (r.Kind == PlaylistKinds.Tip && tips.TryGetValue(r.Id, out var tip))
            {
                items.Add(new
                {
                    kind = PlaylistKinds.Tip,
                    id = tip.Id,
                    vegetable = tip.VegetableCode,
                    vegetableName = NameOf(tip.VegetableCode),
                    title = tip.Heading,
                    blocks = tip.Blocks
                });
            }
        }
        return items;
    }
}