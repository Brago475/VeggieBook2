namespace VeggieBook.Api.Data;

// Default playlist for a notification template. See
// db/migrations/029_template_playlist.sql. Vegetable is "" for a template
// without a vegetable slot, or for any vegetable.

public class TemplatePlaylist
{
    public string TemplateKey { get; set; } = "";
    public string Vegetable { get; set; } = "";
    public int PlaylistId { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}