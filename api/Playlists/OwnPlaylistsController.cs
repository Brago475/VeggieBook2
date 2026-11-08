using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Controllers;
using VeggieBook.Api.Data;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Playlists;

// Playlists people make from recipes in their saved books. Books are only
// read; adding a recipe to a playlist never changes a book.
//
//   GET    /api/playlists/own/choices?lang=          recipes in this account's
//                                                   saved books, by book
//   GET    /api/playlists/own/{id}?lang=             one own playlist with its recipes
//   POST   /api/playlists/own                        { name, recipeIds }
//   PUT    /api/playlists/own/{id}                   { name, recipeIds }
//   DELETE /api/playlists/own/{id}
//   POST   /api/playlists/own/{id}/opened/{recipeId} a recipe opened from it
//
// Every query is limited to the signed-in account. Recipes must be kept in
// one of its saved books when added. Every change writes an activity line.

public record OwnPlaylistRequest(string? Name, List<int>? RecipeIds);

[ApiController]
[Route("api/playlists/own")]
[Authorize]
public class OwnPlaylistsController(
    AccountsContext db,
    VeggieBookContext content,
    ILogger<OwnPlaylistsController> logger) : ControllerBase
{
    private const int MaxName = 60;
    private const int MaxPerUser = 50;

    private Guid CurrentUserId =>
        AuthSetup.UserId(User) ?? throw new InvalidOperationException("Signed-in user has no id.");

    [HttpGet("choices")]
    public async Task<IActionResult> Choices([FromQuery] string? lang)
    {
        var uid = CurrentUserId;
        var es = Lang.IsSpanish(lang);

        var books = await db.Books
            .AsNoTracking()
            .Where(b => b.UserId == uid && b.Kind == "veggie")
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.Id,
                b.VegetableCode,
                b.CreatedAt,
                Recipes = b.Selections
                    .Where(s => s.ContentType == "recipe" && s.Kept)
                    .Select(s => s.ContentId)
                    .ToList()
            })
            .ToListAsync();

        var ids = books.SelectMany(b => b.Recipes).Distinct().ToArray();
        var recipes = (await content.Recipes
                .AsNoTracking()
                .Where(r => ids.Contains(r.Id))
                .Select(r => new
                {
                    r.Id,
                    r.DisplayCode,
                    Title = es ? r.TitleEs : r.TitleEn,
                    Photos = r.Photos.OrderBy(p => p.Position).Select(p => p.ImagePath).ToList()
                })
                .ToListAsync())
            .ToDictionary(r => r.Id);

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .ToDictionaryAsync(v => v.Code, v => es ? v.NameEs : v.NameEn);

        Response.Headers.CacheControl = "no-store";
        return Ok(books
            .Select(b => new
            {
                id = b.Id,
                vegetable = b.VegetableCode,
                vegetableName = b.VegetableCode is string code ? vegetables.GetValueOrDefault(code, code) : "",
                createdAt = b.CreatedAt,
                recipes = b.Recipes
                    .Where(recipes.ContainsKey)
                    .Select(id => recipes[id])
                    .OrderBy(r => r.DisplayCode == null)
                    .ThenBy(r => r.DisplayCode)
                    .ThenBy(r => r.Id)
                    .Select(r => new { id = r.Id, code = r.DisplayCode, title = r.Title, photo = RecipePhotos.Finished(r.Photos) })
                    .ToList()
            })
            .Where(b => b.recipes.Count > 0));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, [FromQuery] string? lang)
    {
        var uid = CurrentUserId;
        var p = await db.UserPlaylists.AsNoTracking().Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (p is null) return NotFound();

        var refs = p.Items
            .OrderBy(i => i.Position)
            .Select(i => new PlaylistRef(PlaylistKinds.Recipe, i.RecipeId))
            .ToList();
        var items = await PlaylistContent.LoadAsync(content, refs, lang);

        await PlaylistActivity.RecordAsync(
            db, logger, uid, PlaylistActivity.Opened, id, PlaylistActivity.SourceOwn, items.Count);

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            id = p.Id,
            name = p.Name,
            recipeIds = refs.Select(r => r.Id),
            items
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OwnPlaylistRequest req)
    {
        var uid = CurrentUserId;

        if (await db.UserPlaylists.CountAsync(u => u.UserId == uid) >= MaxPerUser)
            return Conflict(new { error = $"You can keep up to {MaxPerUser} playlists. Delete one to make room." });

        var (name, recipeIds, error) = await ParseAsync(uid, req);
        if (error is not null) return BadRequest(new { error });

        var p = new UserPlaylist
        {
            UserId = uid,
            Name = name!,
            CreatedAt = DateTime.UtcNow,
            Items = recipeIds!.Select((r, i) => new UserPlaylistItem { Position = i, RecipeId = r }).ToList()
        };
        db.UserPlaylists.Add(p);
        await db.SaveChangesAsync();

        await PlaylistActivity.RecordAsync(
            db, logger, uid, PlaylistActivity.OwnCreated, p.Id, PlaylistActivity.SourceOwn, p.Items.Count);
        return Created($"/api/playlists/own/{p.Id}", new { id = p.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] OwnPlaylistRequest req)
    {
        var uid = CurrentUserId;
        var p = await db.UserPlaylists.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (p is null) return NotFound();

        var (name, recipeIds, error) = await ParseAsync(uid, req, p.Items.Select(i => i.RecipeId));
        if (error is not null) return BadRequest(new { error });

        db.UserPlaylistItems.RemoveRange(p.Items);
        p.Items.Clear();
        p.Items.AddRange(recipeIds!.Select((r, i) => new UserPlaylistItem { Position = i, RecipeId = r }));
        p.Name = name!;
        p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await PlaylistActivity.RecordAsync(
            db, logger, uid, PlaylistActivity.OwnEdited, p.Id, PlaylistActivity.SourceOwn, p.Items.Count);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var uid = CurrentUserId;
        var p = await db.UserPlaylists.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (p is null) return NotFound();

        var count = p.Items.Count;
        db.UserPlaylists.Remove(p);
        await db.SaveChangesAsync();

        await PlaylistActivity.RecordAsync(
            db, logger, uid, PlaylistActivity.OwnDeleted, id, PlaylistActivity.SourceOwn, count);
        return NoContent();
    }

    [HttpPost("{id:int}/opened/{recipeId:int}")]
    public async Task<IActionResult> RecipeOpened(int id, int recipeId)
    {
        var uid = CurrentUserId;
        var inList = await db.UserPlaylistItems.AnyAsync(i =>
            i.UserPlaylistId == id && i.RecipeId == recipeId
            && db.UserPlaylists.Any(u => u.Id == id && u.UserId == uid));
        if (!inList) return NoContent();

        await PlaylistActivity.RecordAsync(
            db, logger, uid, PlaylistActivity.ItemOpened, id,
            PlaylistActivity.ItemDetail(PlaylistActivity.SourceOwn, PlaylistKinds.Recipe, recipeId));
        return NoContent();
    }

    // Recipes already in the playlist may stay even if since taken out of a
    // book; new ones must be kept in one of the account's saved books.
    private async Task<(string? Name, List<int>? RecipeIds, string? Error)> ParseAsync(
        Guid uid, OwnPlaylistRequest req, IEnumerable<int>? already = null)
    {
        var name = (req.Name ?? "").Trim();
        if (name.Length == 0) return (null, null, "Give your playlist a name.");
        if (name.Length > MaxName) return (null, null, $"Keep the name to {MaxName} characters or fewer.");

        var ids = req.RecipeIds ?? [];
        if (ids.Count == 0) return (null, null, "Pick at least one recipe.");
        if (ids.Count > PlaylistHelpers.MaxItems)
            return (null, null, $"A playlist can hold up to {PlaylistHelpers.MaxItems} recipes.");
        if (ids.Distinct().Count() != ids.Count) return (null, null, "A recipe is listed twice.");

        var allowed = (await db.Books
                .AsNoTracking()
                .Where(b => b.UserId == uid)
                .SelectMany(b => b.Selections.Where(s => s.ContentType == "recipe" && s.Kept).Select(s => s.ContentId))
                .ToListAsync())
            .Concat(already ?? [])
            .ToHashSet();
        if (ids.Any(i => !allowed.Contains(i)))
            return (null, null, "Pick recipes from your saved books.");

        return (name, ids, null);
    }
}