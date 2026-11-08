using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Playlists;
using VeggieBook.Api.Recipes;

namespace VeggieBook.Api.Admin;

// The Playlists page.
//
//   GET  /api/admin/playlists              every playlist with counts
//   GET  /api/admin/playlists/{id}         one playlist with its items
//   GET  /api/admin/playlists/options      vegetables, topics from the
//                                          question labels, and how many tips
//                                          and recipes each pair has
//   GET  /api/admin/playlists/content      browse tips and recipes by
//                                          ?vegetable=, ?topic= and ?q=
//   POST /api/admin/playlists/preview      items as the app shows them,
//                                          body { items, lang }
//   POST /api/admin/playlists              create
//   PUT  /api/admin/playlists/{id}         edit names and items
//   POST /api/admin/playlists/{id}/archive no longer offered for new sends
//   POST /api/admin/playlists/{id}/restore offered again
//
// A recipe matches a topic when the topic is one of its labels. Playlists are
// archived, never deleted, so a kept playlist never disappears. Admins only.
// Every change is written to the activity log.

public record PlaylistItemRequest(string? Kind, int Id);

public record PlaylistRequest(string? NameEn, string? NameEs, List<PlaylistItemRequest>? Items);

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
    private const int MaxItems = 60;
    private const int SnippetLength = 140;

    private sealed record Parsed(string NameEn, string? NameEs, List<PlaylistRef> Items);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var playlists = await db.Playlists
            .AsNoTracking()
            .Select(p => new
            {
                p.Id,
                p.NameEn,
                p.NameEs,
                p.ArchivedAt,
                p.CreatedAt,
                p.UpdatedAt,
                Tips = p.Items.Count(i => i.Kind == PlaylistKinds.Tip),
                Recipes = p.Items.Count(i => i.Kind == PlaylistKinds.Recipe)
            })
            .ToListAsync();

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
                nameEn = p.NameEn,
                nameEs = p.NameEs,
                archived = p.ArchivedAt != null,
                archivedAt = p.ArchivedAt,
                createdAt = p.CreatedAt,
                updatedAt = p.UpdatedAt,
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
            .Select(v => new { code = v.Code, name = v.NameEn })
            .ToListAsync();

        // Visible question choices, in the order the app asks them.
        var choiceRows = await content.QuestionChoices
            .AsNoTracking()
            .Where(c => !c.Question!.IsHidden)
            .OrderBy(c => c.Question!.Phase)
            .ThenBy(c => c.Question!.OrderPriority)
            .ThenBy(c => c.SortOrder)
            .Select(c => new { c.Attribute, c.TextEn, c.TextEs, Question = c.Question!.Mnemonic })
            .ToListAsync();

        var topics = choiceRows
            .GroupBy(c => c.Attribute)
            .Select(g => g.First())
            .Select(c => new
            {
                topic = c.Attribute,
                question = c.Question,
                textEn = c.TextEn,
                textEs = c.TextEs,
                label = c.TextEn.Replace("%s", "vegetables")
            })
            .ToList();
        var known = topics.Select(t => t.topic).ToHashSet();

        var tipCounts = await content.Tips
            .AsNoTracking()
            .GroupBy(t => new { t.VegetableCode, t.Attribute })
            .Select(g => new { g.Key.VegetableCode, g.Key.Attribute, Count = g.Count() })
            .ToListAsync();

        var recipeCounts = await (
                from a in content.RecipeAttributes
                join r in content.Recipes on a.RecipeId equals r.Id
                where r.Active
                group a by new { r.VegetableCode, a.Attribute } into g
                select new { g.Key.VegetableCode, g.Key.Attribute, Count = g.Count() })
            .ToListAsync();

        var counts = tipCounts
            .Select(t => (t.VegetableCode, t.Attribute))
            .Concat(recipeCounts.Select(r => (r.VegetableCode, r.Attribute)))
            .Distinct()
            .Where(k => known.Contains(k.Attribute))
            .Select(k => new
            {
                vegetable = k.VegetableCode,
                topic = k.Attribute,
                tips = tipCounts.FirstOrDefault(t => t.VegetableCode == k.VegetableCode && t.Attribute == k.Attribute)?.Count ?? 0,
                recipes = recipeCounts.FirstOrDefault(r => r.VegetableCode == k.VegetableCode && r.Attribute == k.Attribute)?.Count ?? 0
            })
            .ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(new { vegetables, topics, counts });
    }

    // Everything that matches, for "view all" before adding. At least one
    // filter is required.
    [HttpGet("content")]
    public async Task<IActionResult> Browse(
        [FromQuery] string? vegetable,
        [FromQuery] string? topic,
        [FromQuery] string? q)
    {
        var veg = string.IsNullOrWhiteSpace(vegetable) ? null : vegetable.Trim();
        var top = string.IsNullOrWhiteSpace(topic) ? null : topic.Trim();
        var search = string.IsNullOrWhiteSpace(q) ? null : $"%{q.Trim()}%";
        if (veg is null && top is null && search is null)
            return BadRequest(new { error = "Pick a vegetable, a topic, or type a search." });

        var vegetables = await content.Vegetables
            .AsNoTracking()
            .Select(v => new { v.Code, v.NameEn, v.SortOrder })
            .ToDictionaryAsync(v => v.Code);
        int OrderOf(string code) => vegetables.TryGetValue(code, out var v) ? v.SortOrder : int.MaxValue;
        string NameOf(string code) => vegetables.TryGetValue(code, out var v) ? v.NameEn : code;

        var tipQuery = content.Tips.AsNoTracking().AsQueryable();
        if (veg is not null) tipQuery = tipQuery.Where(t => t.VegetableCode == veg);
        if (top is not null) tipQuery = tipQuery.Where(t => t.Attribute == top);
        if (search is not null)
            tipQuery = tipQuery.Where(t =>
                EF.Functions.ILike(t.HeadingEn, search)
                || t.Blocks.Any(b => EF.Functions.ILike(b.TextEn, search)));

        var tipRows = await tipQuery
            .Select(t => new
            {
                t.Id,
                t.VegetableCode,
                t.Attribute,
                t.HeadingEn,
                t.SortOrder,
                First = t.Blocks.OrderBy(b => b.Position).Select(b => b.TextEn).FirstOrDefault(),
                BlockCount = t.Blocks.Count
            })
            .ToListAsync();

        var recipeQuery = content.Recipes.AsNoTracking().Where(r => r.Active);
        if (veg is not null) recipeQuery = recipeQuery.Where(r => r.VegetableCode == veg);
        if (top is not null) recipeQuery = recipeQuery.Where(r => r.Attributes.Any(a => a.Attribute == top));
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
                Topics = r.Attributes.Select(a => a.Attribute).ToList(),
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
                topics = new[] { t.Attribute },
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
                code = r.DisplayCode,
                title = r.TitleEn,
                topics = r.Topics,
                photo = RecipePhotos.Finished(r.Photos)
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
            .Take(MaxItems)
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
            Items = ToItems(parsed.Items)
        };
        db.Playlists.Add(p);
        await db.SaveChangesAsync();

        await PlaylistActivity.RecordAdminAsync(db, logger, PlaylistActivity.Created, p, Summary(p));
        return Ok(await DescribeAsync(p));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Edit(int id, [FromBody] PlaylistRequest req)
    {
        var p = await db.Playlists.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound(new { error = "That playlist no longer exists. Refresh the page." });

        var (parsed, error) = await ParseAsync(req);
        if (parsed is null) return BadRequest(new { error });

        var before = p.NameEn;

        // Items are replaced as a whole; positions follow the new order.
        db.PlaylistItems.RemoveRange(p.Items);
        p.Items.Clear();
        p.Items.AddRange(ToItems(parsed.Items));

        p.NameEn = parsed.NameEn;
        p.NameEs = parsed.NameEs;
        p.UpdatedAt = DateTime.UtcNow;
        p.UpdatedBy = AdminId();
        await db.SaveChangesAsync();

        var summary = before == p.NameEn
            ? Summary(p)
            : $"Renamed from \"{before}\" to \"{p.NameEn}\", {Summary(p)}";
        await PlaylistActivity.RecordAdminAsync(db, logger, PlaylistActivity.Edited, p, summary);
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
        await db.SaveChangesAsync();

        var kept = await db.PlaylistChoices.CountAsync(c => c.PlaylistId == id && c.Kept);
        await PlaylistActivity.RecordAdminAsync(
            db, logger, PlaylistActivity.Archived, p, $"Archived, kept by {People(kept)}");
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
        await db.SaveChangesAsync();

        await PlaylistActivity.RecordAdminAsync(db, logger, PlaylistActivity.Edited, p, $"Restored, {Summary(p)}");
        return Ok(await DescribeAsync(p));
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
        if (raw.Count > MaxItems) return (null, $"A playlist can hold up to {MaxItems} items.");
        if (raw.Any(i => !PlaylistKinds.IsKnown(i.Kind))) return (null, "One of the items is not a tip or a recipe.");

        var refs = raw.Select(i => new PlaylistRef(i.Kind!, i.Id)).ToList();
        if (refs.Distinct().Count() != refs.Count) return (null, "An item is listed twice.");

        var recipeIds = refs.Where(r => r.Kind == PlaylistKinds.Recipe).Select(r => r.Id).ToArray();
        var tipIds = refs.Where(r => r.Kind == PlaylistKinds.Tip).Select(r => r.Id).ToArray();

        var foundRecipes = await content.Recipes.CountAsync(r => recipeIds.Contains(r.Id) && r.Active);
        if (foundRecipes != recipeIds.Length) return (null, "One of the recipes is no longer available. Refresh and try again.");

        var foundTips = await content.Tips.CountAsync(t => tipIds.Contains(t.Id));
        if (foundTips != tipIds.Length) return (null, "One of the tips is no longer available. Refresh and try again.");

        return (new Parsed(nameEn, nameEs.Length == 0 ? null : nameEs, refs), null);
    }

    private static List<PlaylistItem> ToItems(List<PlaylistRef> refs) =>
        refs.Select((r, i) => new PlaylistItem { Position = i, Kind = r.Kind, ItemId = r.Id }).ToList();

    private async Task<object> DescribeAsync(Playlist p)
    {
        var refs = p.Items
            .OrderBy(i => i.Position)
            .Select(i => new PlaylistRef(i.Kind, i.ItemId))
            .ToList();

        return new
        {
            id = p.Id,
            nameEn = p.NameEn,
            nameEs = p.NameEs,
            archived = p.ArchivedAt != null,
            archivedAt = p.ArchivedAt,
            createdAt = p.CreatedAt,
            updatedAt = p.UpdatedAt,
            items = await PlaylistContent.LoadAsync(content, refs, "en")
        };
    }

    // "2 tips and 4 recipes"
    private static string Summary(Playlist p)
    {
        var tips = p.Items.Count(i => i.Kind == PlaylistKinds.Tip);
        var recipes = p.Items.Count(i => i.Kind == PlaylistKinds.Recipe);
        return $"{Count(tips, "tip")} and {Count(recipes, "recipe")}";
    }

    private static string Count(int n, string word) => n == 1 ? $"1 {word}" : $"{n} {word}s";

    private static string People(int n) => n == 1 ? "1 person" : $"{n} people";

    private static string? Clip(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var t = text.Trim();
        return t.Length <= SnippetLength ? t : t[..SnippetLength].TrimEnd() + "...";
    }

    private Guid? AdminId() =>
        Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
}