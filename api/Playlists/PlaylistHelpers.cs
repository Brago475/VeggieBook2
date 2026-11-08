using VeggieBook.Api.Data;

namespace VeggieBook.Api.Playlists;

// Small helpers shared by the admin playlist endpoints and automatic playlists.

public static class PlaylistHelpers
{
    public const int MaxItems = 60;

    public static List<PlaylistItem> ToItems(IEnumerable<PlaylistRef> refs) =>
        refs.Select((r, i) => new PlaylistItem { Position = i, Kind = r.Kind, ItemId = r.Id }).ToList();

    public static List<PlaylistRef> RefsOf(Playlist p) =>
        p.Items.OrderBy(i => i.Position).Select(i => new PlaylistRef(i.Kind, i.ItemId)).ToList();

    public static string Count(int n, string word) => n == 1 ? $"1 {word}" : $"{n} {word}s";

    // "2 tips and 4 recipes"
    public static string Summary(Playlist p)
    {
        var tips = p.Items.Count(i => i.Kind == PlaylistKinds.Tip);
        var recipes = p.Items.Count(i => i.Kind == PlaylistKinds.Recipe);
        return $"{Count(tips, "tip")} and {Count(recipes, "recipe")}";
    }
}