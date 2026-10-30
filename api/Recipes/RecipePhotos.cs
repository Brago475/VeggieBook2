using System.Text.RegularExpressions;

namespace VeggieBook.Api.Recipes;

// Picks the finished-dish photo of a recipe. Shared by the site and the book PDF.
public static class RecipePhotos
{
    private static readonly Regex PrepShot = new(@"prep\d*", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // The last photo not named as a prep shot, else the last photo.
    public static string? Finished(IReadOnlyList<string> photos)
    {
        if (photos.Count == 0) return null;
        return photos.LastOrDefault(p => !PrepShot.IsMatch(p)) ?? photos[^1];
    }

    // The finished photo first, then the others in their saved order.
    public static List<string> FinishedFirst(IReadOnlyList<string> photos)
    {
        var finished = Finished(photos);
        if (finished is null) return [];

        var ordered = photos.ToList();
        ordered.Remove(finished);
        ordered.Insert(0, finished);
        return ordered;
    }
}