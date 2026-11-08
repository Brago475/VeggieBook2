namespace VeggieBook.Api.Data;

// Playlists. See db/migrations/023_playlists.sql.
//
//   Playlist      made by an admin, sent through notifications
//   PlaylistItem  one tip or recipe in an admin playlist
//   PlaylistChoice Keep or Skip by one account
//   UserPlaylist  made by an account from recipes in its saved books

public static class PlaylistKinds
{
    public const string Tip = "tip";
    public const string Recipe = "recipe";

    public static bool IsKnown(string? kind) => kind is Tip or Recipe;
}

public class Playlist
{
    public int Id { get; set; }
    public string NameEn { get; set; } = "";

    // Optional; Spanish readers see the English name without it.
    public string? NameEs { get; set; }

    // Archived playlists cannot be sent again but stay with those who kept them.
    public DateTime? ArchivedAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public List<PlaylistItem> Items { get; set; } = [];
}

public class PlaylistItem
{
    public long Id { get; set; }
    public int PlaylistId { get; set; }
    public int Position { get; set; }
    public string Kind { get; set; } = PlaylistKinds.Recipe;
    public int ItemId { get; set; }
}

public class PlaylistChoice
{
    public int PlaylistId { get; set; }
    public Guid UserId { get; set; }
    public bool Kept { get; set; }
    public int? NotificationId { get; set; }
    public DateTime DecidedAt { get; set; }
}

public class UserPlaylist
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<UserPlaylistItem> Items { get; set; } = [];
}

public class UserPlaylistItem
{
    public long Id { get; set; }
    public int UserPlaylistId { get; set; }
    public int Position { get; set; }
    public int RecipeId { get; set; }
}