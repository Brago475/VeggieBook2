using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Playlists;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Admin;

// Playlists, in the Notifications page.
//
//   GET  /api/admin/playlists              every playlist with counts
//   GET  /api/admin/playlists/{id}         one playlist with its items
//   GET  /api/admin/playlists/options      vegetables with pictures, the four
//                                          meals, and how many tips and
//                                          recipes each pair has
//   GET  /api/admin/playlists/content      browse by ?vegetable=, ?meal= and ?q=
//   POST /api/admin/playlists/preview      items as the app shows them,
//                                          body { items, lang }
//   POST /api/admin/playlists              create a hand-made playlist
//   PUT  /api/admin/playlists/{id}         edit names and items; an automatic
//                                          playlist becomes hand-made
//   POST /api/admin/playlists/{id}/archive no longer offered for new sends
//   POST /api/admin/playlists/{id}/restore offered again
//
// Edit takes the version the page loaded. If another admin saved since, the
// change is refused with changed: true so the page can reload. Without a
// version (older pages) no check is made.
//
// Automatic playlists are made from the notification editor (AutoPlaylists).
// Playlists are archived, never deleted. Admins only. Every change is
// written to the activity log with the admin who did it.

public record PlaylistItemRequest(string? Kind, int Id);

public record PlaylistRequest(string? NameEn, string? NameEs, List<PlaylistItemRequest>? Items, uint? Version);

public record PlaylistPreviewRequest(List<PlaylistItemRequest>? Items, string? Lang);

[ApiController]
[Route("api/admin/playlists")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminPlaylistsController(
    AccountsContext db,
    VeggieBookContext content,
    UserManager<AppUser> users,
    ILogger<AdminPlaylistsController> logger) : ControllerBase
{
    private const int MaxName = 80;
    private const int SnippetLength = 140;

    private const string Changed =
        "Another admin changed this playlist. Refresh to see the latest.";

    private sealed record Parsed(string NameEn, string? NameEs, List<PlaylistRef> Items);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var playlists = await db.Playlists
            .AsNoTracking()
            .Select(p => new
            {
                p.Id,
                p.Version,
                p.NameEn,
                p.NameEs,
                p.AutoVegetable,
                p.AutoMeal,
                p.ArchivedAt,
                p.CreatedAt,
                p.CreatedBy,
                p.UpdatedAt,
                p.UpdatedBy,
                Tips = p.Items.Count(i => i.Kind == PlaylistKinds.Tip),
                Recipes = p.Items.Count(i => i.Kind == PlaylistKinds.Recipe)
            })
            .ToListAsync();

        var names = await AdminNames.LoadAsync(db, playlists.SelectMany(p => new[] { p.CreatedBy, p.UpdatedBy }));

        var choices = await db.PlaylistChoices
            .AsNoTracking()
            .GroupBy(c => c.PlaylistId)
            .Select(g => new { Id = g.Key, Kept = g.Count(c => c.Kept), NotKept = g.Count(c => !c.Kept) })
            .ToDictionaryAsync(x => x.Id);

        var now = DateTime.UtcNow;
        var sends = (await db.Notifications
                .AsNoTracking()
                .Where(n => n.PlaylistId != null)
                .Select(n => new
                {
                    Id = n.PlaylistId!.Value,
                    Live = n.CancelledAt == null && n.StartsAt <= now && n.ExpiresAt > now
                })
                .ToListAsync())
            .ToLookup(x => x.Id);

        Response.Headers.CacheControl = "no-store";
        return Ok(playlists
            .OrderBy(p => p.ArchivedAt != null)
            .ThenByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Select(p => new
            {
                id = p.Id,
                version = p.Version,
                nameEn = p.NameEn,
                nameEs = p.NameEs,
                auto = p.AutoMeal != null,
                autoVegetable = p.AutoVegetable,
                autoMeal = p.AutoMeal,
                archived = p.ArchivedAt != null,
                archivedAt = p.ArchivedAt,
                createdAt = p.CreatedAt,
                createdBy = AdminNames.Of(names, p.CreatedBy),
                updatedAt = p.UpdatedAt,
                updatedBy = AdminNames.Of(names, p.UpdatedBy),
                tips = p.Tips,
                recipes = p.Recipes,
                kept = choices.TryGetValue(p.Id, out var c) ? c.Kept : 0,
                notKept = choices.TryGetValue(p.Id, out var c2) ? c2.NotKept : 0,
                sent = sends[p.Id].Count(),
                live = sends[p.Id].Any(s => s.Live)
            }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var p = await db.Playlists
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound(new { error = "That playlist no longer exists. Refresh the page." });

        Response.Headers.CacheControl = "no-store";
        return Ok(await DescribeAsync(p));
    }

    [HttpGet("options")]
    public async Task<IActionResult> Options()
    {
        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Where(v => v.Active)
            .OrderBy(v => v.SortOrder)
            .Select(v => new { code = v.Code, name = v.NameEn, nameEs = v.NameEs, image = v.ImagePath })
            .ToListAsync();

        var labels = await db.MealLabels
            .AsNoTracking()
            .Select(m => new { m.Kind, m.ItemId, m.Meal })
            .ToListAsync();

        var recipeVeg = await content.Recipes
            .AsNoTracking()
            .Where(r => r.Active)
            .ToDictionaryAsync(r => r.Id, r => r.VegetableCode);
        var tipVeg = await content.Tips
            .AsNoTracking()
            .ToDictionaryAsync(t => t.Id, t => t.VegetableCode);

        var counts = labels
            .Select(l => new
            {
                Vegetable = l.Kind == PlaylistKinds.Tip
                    ? tipVeg.GetValueOrDefault(l.ItemId)
                    : recipeVeg.GetValueOrDefault(l.ItemId),
                l.Meal,
                l.Kind
            })
            .Where(x => x.Vegetable != null)
            .GroupBy(x => (x.Vegetable, x.Meal))
            .Select(g => new
            {
                vegetable = g.Key.Vegetable,
                meal = g.Key.Meal,
                tips = g.Count(x => x.Kind == PlaylistKinds.Tip),
                recipes = g.Count(x => x.Kind == PlaylistKinds.Recipe)
            })
            .ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(new
        {
            vegetables,
            meals = Meals.All.Select(m => new { key = m.Key, en = m.En, es = m.Es }),
            counts
        });
    }

    // Everything that matches, for View all before adding. At least one
    // filter is required.
    [HttpGet("content")]
    public async Task<IActionResult> Browse(
        [FromQuery] string? vegetable,
        [FromQuery] string? meal,
        [FromQuery] string? q)
    {
        var veg = string.IsNullOrWhiteSpace(vegetable) ? null : vegetable.Trim();
        var mealKey = Meals.Find(meal)?.Key;
        var search = string.IsNullOrWhiteSpace(q) ? null : $"%{q.Trim()}%";
        if (veg is null && mealKey is null && search is null)
            return BadRequest(new { error = "Pick a vegetable, a meal, or type a search." });

        var labels = await db.MealLabels
            .AsNoTracking()
            .Select(m => new { m.Kind, m.ItemId, m.Meal })
            .ToListAsync();
        var mealsOf = labels.ToLookup(l => (l.Kind, l.ItemId), l => l.Meal);

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Select(v => new { v.Code, v.NameEn, v.SortOrder })
            .ToDictionaryAsync(v => v.Code);
        int OrderOf(string code) => vegetables.TryGetValue(code, out var v) ? v.SortOrder : int.MaxValue;
        string NameOf(string code) => vegetables.TryGetValue(code, out var v) ? v.NameEn : code;

        var tipQuery = content.Tips.AsNoTracking().AsQueryable();
        if (veg is not null) tipQuery = tipQuery.Where(t => t.VegetableCode == veg);
        if (mealKey is not null)
        {
            var ids = labels.Where(l => l.Meal == mealKey && l.Kind == PlaylistKinds.Tip).Select(l => l.ItemId).ToArray();
            tipQuery = tipQuery.Where(t => ids.Contains(t.Id));
        }
        if (search is not null)
            tipQuery = tipQuery.Where(t =>
                EF.Functions.ILike(t.HeadingEn, search)
                || t.Blocks.Any(b => EF.Functions.ILike(b.TextEn, search)));

        var tipRows = await tipQuery
            .Select(t => new
            {
                t.Id,
                t.VegetableCode,
                t.HeadingEn,
                t.SortOrder,
                First = t.Blocks.OrderBy(b => b.Position).Select(b => b.TextEn).FirstOrDefault(),
                Image = t.Blocks.Where(b => b.ImagePath != null).OrderBy(b => b.Position)
                    .Select(b => b.ImagePath).FirstOrDefault(),
                BlockCount = t.Blocks.Count
            })
            .ToListAsync();

        var recipeQuery = content.Recipes.AsNoTracking().Where(r => r.Active);
        if (veg is not null) recipeQuery = recipeQuery.Where(r => r.VegetableCode == veg);
        if (mealKey is not null)
        {
            var ids = labels.Where(l => l.Meal == mealKey && l.Kind == PlaylistKinds.Recipe).Select(l => l.ItemId).ToArray();
            recipeQuery = recipeQuery.Where(r => ids.Contains(r.Id));
        }
        if (search is not null)
            recipeQuery = recipeQuery.Where(r =>
                EF.Functions.ILike(r.TitleEn, search)
                || (r.DisplayCode != null && EF.Functions.ILike(r.DisplayCode, search)));

        var recipeRows = await recipeQuery
            .Select(r => new
            {
                r.Id,
                r.DisplayCode,
                r.VegetableCode,
                r.TitleEn,
                Photos = r.Photos.OrderBy(p => p.Position).Select(p => p.ImagePath).ToList()
            })
            .ToListAsync();

        var tips = tipRows
            .OrderBy(t => OrderOf(t.VegetableCode))
            .ThenBy(t => t.SortOrder)
            .Select(t => new
            {
                kind = PlaylistKinds.Tip,
                id = t.Id,
                vegetable = t.VegetableCode,
                vegetableName = NameOf(t.VegetableCode),
                title = t.HeadingEn,
                meals = Meals.Ordered(mealsOf[(PlaylistKinds.Tip, t.Id)]),
                code = (string?)null,
                photo = t.Image,
                snippet = Clip(t.First),
                blocks = t.BlockCount
            })
            .ToList();

        var recipes = recipeRows
            .OrderBy(r => OrderOf(r.VegetableCode))
            .ThenBy(r => r.DisplayCode == null)
            .ThenBy(r => r.DisplayCode)
            .ThenBy(r => r.Id)
            .Select(r => new
            {
                kind = PlaylistKinds.Recipe,
                id = r.Id,
                vegetable = r.VegetableCode,
                vegetableName = NameOf(r.VegetableCode),
                title = r.TitleEn,
                meals = Meals.Ordered(mealsOf[(PlaylistKinds.Recipe, r.Id)]),
                code = r.DisplayCode,
                photo = RecipePhotos.Finished(r.Photos),
                snippet = (string?)null,
                blocks = 0
            })
            .ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(new { tipCount = tips.Count, recipeCount = recipes.Count, tips, recipes });
    }

    // Items as the app shows them, before saving.
    [HttpPost("preview")]
    public async Task<IActionResult> Preview([FromBody] PlaylistPreviewRequest req)
    {
        var refs = (req.Items ?? [])
            .Where(i => PlaylistKinds.IsKnown(i.Kind))
            .Select(i => new PlaylistRef(i.Kind!, i.Id))
            .Distinct()
            .Take(PlaylistHelpers.MaxItems)
            .ToList();

        return Ok(new { items = await PlaylistContent.LoadAsync(content, refs, req.Lang) });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PlaylistRequest req)
    {
        var (parsed, error) = await ParseAsync(req);
        if (parsed is null) return BadRequest(new { error });

        var p = new Playlist
        {
            NameEn = parsed.NameEn,
            NameEs = parsed.NameEs,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = AdminId(),
            Items = PlaylistHelpers.ToItems(parsed.Items)
        };
        db.Playlists.Add(p);
        await db.SaveChangesAsync();

        await PlaylistActivity.RecordAdminAsync(
            db, logger, PlaylistActivity.Created, p, PlaylistHelpers.Summary(p), AdminId());
        return Ok(await DescribeAsync(p));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Edit(int id, [FromBody] PlaylistRequest req)
    {
        var p = await db.Playlists.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound(new { error = "That playlist no longer exists. Refresh the page." });
        if (req.Version is uint v && v != p.Version) return Conflict(new { error = Changed, changed = true });

        var (parsed, error) = await ParseAsync(req);
        if (parsed is null) return BadRequest(new { error });

        var before = p.NameEn;
        var wasAuto = p.AutoMeal is not null;

        // Items are replaced as a whole; positions follow the new order.
        db.PlaylistItems.RemoveRange(p.Items);
        p.Items.Clear();
        p.Items.AddRange(PlaylistHelpers.ToItems(parsed.Items));

        p.NameEn = parsed.NameEn;
        p.NameEs = parsed.NameEs;
        p.AutoVegetable = null;
        p.AutoMeal = null;
        p.UpdatedAt = DateTime.UtcNow;
        p.UpdatedBy = AdminId();
        if (!await SaveAsync()) return Conflict(new { error = Changed, changed = true });

        var parts = new List<string>();
        if (before != p.NameEn) parts.Add($"Renamed from \"{before}\" to \"{p.NameEn}\"");
        if (wasAuto) parts.Add("now hand-made");
        parts.Add(PlaylistHelpers.Summary(p));
        await PlaylistActivity.RecordAdminAsync(
            db, logger, PlaylistActivity.Edited, p, string.Join(", ", parts), AdminId());
        return Ok(await DescribeAsync(p));
    }

    [HttpPost("{id:int}/archive")]
    public async Task<IActionResult> Archive(int id)
    {
        var p = await db.Playlists.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound(new { error = "That playlist no longer exists. Refresh the page." });
        if (p.ArchivedAt is not null) return Ok(await DescribeAsync(p));

        var now = DateTime.UtcNow;
        p.ArchivedAt = now;
        p.UpdatedAt = now;
        p.UpdatedBy = AdminId();
        if (!await SaveAsync()) return Conflict(new { error = Changed, changed = true });

        var kept = await db.PlaylistChoices.CountAsync(c => c.PlaylistId == id && c.Kept);
        var people = kept == 1 ? "1 person" : $"{kept} people";
        await PlaylistActivity.RecordAdminAsync(
            db, logger, PlaylistActivity.Archived, p, $"Archived, kept by {people}", AdminId());
        return Ok(await DescribeAsync(p));
    }

    [HttpPost("{id:int}/restore")]
    public async Task<IActionResult> Restore(int id)
    {
        var p = await db.Playlists.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound(new { error = "That playlist no longer exists. Refresh the page." });
        if (p.ArchivedAt is null) return Ok(await DescribeAsync(p));

        p.ArchivedAt = null;
        p.UpdatedAt = DateTime.UtcNow;
        p.UpdatedBy = AdminId();
        if (!await SaveAsync()) return Conflict(new { error = Changed, changed = true });

        await PlaylistActivity.RecordAdminAsync(
            db, logger, PlaylistActivity.Edited, p, $"Restored, {PlaylistHelpers.Summary(p)}", AdminId());
        return Ok(await DescribeAsync(p));
    }

    // False when another save landed between reading and saving.
    private async Task<bool> SaveAsync()
    {
        try
        {
            await db.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }
    }

    private async Task<(Parsed? Value, string? Error)> ParseAsync(PlaylistRequest req)
    {
        var nameEn = (req.NameEn ?? "").Trim();
        if (nameEn.Length == 0) return (null, "Give the playlist a name.");
        if (nameEn.Length > MaxName) return (null, $"Keep the name to {MaxName} characters or fewer.");

        var nameEs = (req.NameEs ?? "").Trim();
        if (nameEs.Length > MaxName) return (null, $"Keep the Spanish name to {MaxName} characters or fewer.");

        var raw = req.Items ?? [];
        if (raw.Count == 0) return (null, "Add at least one tip or recipe.");
        if (raw.Count > PlaylistHelpers.MaxItems)
            return (null, $"A playlist can hold up to {PlaylistHelpers.MaxItems} items.");
        if (raw.Any(i => !PlaylistKinds.IsKnown(i.Kind))) return (null, "One of the items is not a tip or a recipe.");

        var refs = raw.Select(i => new PlaylistRef(i.Kind!, i.Id)).ToList();
        if (refs.Distinct().Count() != refs.Count) return (null, "An item is listed twice.");

        var recipeIds = refs.Where(r => r.Kind == PlaylistKinds.Recipe).Select(r => r.Id).ToArray();
        var tipIds = refs.Where(r => r.Kind == PlaylistKinds.Tip).Select(r => r.Id).ToArray();

        var foundRecipes = await content.Recipes.CountAsync(r => recipeIds.Contains(r.Id) && r.Active);
        if (foundRecipes != recipeIds.Length)
            return (null, "One of the recipes is no longer available. Refresh and try again.");

        var foundTips = await content.Tips.CountAsync(t => tipIds.Contains(t.Id));
        if (foundTips != tipIds.Length)
            return (null, "One of the tips is no longer available. Refresh and try again.");

        return (new Parsed(nameEn, nameEs.Length == 0 ? null : nameEs, refs), null);
    }

    private async Task<object> DescribeAsync(Playlist p)
    {
        var names = await AdminNames.LoadAsync(db, [p.CreatedBy, p.UpdatedBy]);
        return new
        {
            id = p.Id,
            version = p.Version,
            nameEn = p.NameEn,
            nameEs = p.NameEs,
            auto = p.AutoMeal != null,
            autoVegetable = p.AutoVegetable,
            autoMeal = p.AutoMeal,
            archived = p.ArchivedAt != null,
            archivedAt = p.ArchivedAt,
            createdAt = p.CreatedAt,
            createdBy = AdminNames.Of(names, p.CreatedBy),
            updatedAt = p.UpdatedAt,
            updatedBy = AdminNames.Of(names, p.UpdatedBy),
            items = await PlaylistContent.LoadAsync(content, PlaylistHelpers.RefsOf(p), "en")
        };
    }

    private static string? Clip(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var t = text.Trim();
        return t.Length <= SnippetLength ? t : t[..SnippetLength].TrimEnd() + "...";
    }

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}