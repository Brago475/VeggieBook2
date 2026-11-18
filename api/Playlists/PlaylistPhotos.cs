using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Playlists;

// Photos for playlist cards: the first few items, in playlist order, that
// have a photo. A recipe uses its finished-dish photo, a tip its first
// image. Retired recipes and missing content are skipped.

public static class PlaylistPhotos
{
    public const int PerPlaylist = 4;

    // Photo paths for each playlist id, at most PerPlaylist each.
    public static async Task<Dictionary<int, List<string>>> ForPlaylistsAsync(
        AccountsContext db,
        VeggieBookContext content,
        IReadOnlyCollection<int> playlistIds)
    {
        var rows = await db.PlaylistItems
            .AsNoTracking()
            .Where(i => playlistIds.Contains(i.PlaylistId))
            .OrderBy(i => i.PlaylistId)
            .ThenBy(i => i.Position)
            .Select(i => new { i.PlaylistId, i.Kind, i.ItemId })
            .ToListAsync();

        var recipeIds = rows.Where(r => r.Kind == PlaylistKinds.Recipe).Select(r => r.ItemId).Distinct().ToArray();
        var tipIds = rows.Where(r => r.Kind == PlaylistKinds.Tip).Select(r => r.ItemId).Distinct().ToArray();

        var recipePhotos = (await content.Recipes
                .AsNoTracking()
                .Where(r => recipeIds.Contains(r.Id) && r.Active)
                .Select(r => new { r.Id, Photos = r.Photos.OrderBy(p => p.Position).Select(p => p.ImagePath).ToList() })
                .ToListAsync())
            .ToDictionary(r => r.Id, r => RecipePhotos.Finished(r.Photos));

        var tipPhotos = await content.Tips
            .AsNoTracking()
            .Where(t => tipIds.Contains(t.Id))
            .Select(t => new
            {
                t.Id,
                Image = t.Blocks.Where(b => b.ImagePath != null).OrderBy(b => b.Position)
                    .Select(b => b.ImagePath).FirstOrDefault()
            })
            .ToDictionaryAsync(t => t.Id, t => t.Image);

        string? PhotoOf(string kind, int id) =>
            kind == PlaylistKinds.Recipe
                ? recipePhotos.GetValueOrDefault(id)
                : tipPhotos.GetValueOrDefault(id);

        return rows
            .GroupBy(r => r.PlaylistId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(r => PhotoOf(r.Kind, r.ItemId))
                    .OfType<string>()
                    .Take(PerPlaylist)
                    .ToList());
    }
}