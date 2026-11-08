using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Notifications;
using VeggieBook.Api.Playlists;
using VeggieBook.Api.Research;
using VeggieBook.Api.Research.AllData;

namespace VeggieBook.Api.Admin;

/// <summary>
/// Full activity history for the admin Activity page, newest first.
///
///   GET /api/admin/activity?study={number}
///
/// Event types: book_saved, joined, book_deleted, item_removed, book_printed,
/// book_downloaded, account_deleted, research_erased, tracking_on,
/// tracking_off, study_started, study_ended, study_renamed, study_deleted,
/// notice_joined, notice_declined, notification_shown, notification_opened,
/// notification_link, notification_dismissed, notification_created,
/// notification_edited, notification_stopped, playlist_created,
/// playlist_edited, playlist_archived, playlist_opened, playlist_kept,
/// playlist_skipped, playlist_removed, playlist_item_opened,
/// user_playlist_created, user_playlist_edited, user_playlist_deleted,
/// meal_labels_changed.
///
/// Participant events show only if tracking was on when they happened
/// (ResearchScope.CountsBook). Account deletions and erases always show.
/// Saves come from the book table, deleted books and accounts included, plus
/// book_saved log lines for books no longer in it. A save line shows what was
/// kept and taken out at the moment of saving ("-" when drops were not
/// recorded yet); later take-outs are their own lines. Notification lines
/// read "What happened: Title", using the message's current title, and show
/// the start of its text, with the round (counted from 1) for a repeating
/// message. Playlist lines use the playlist's current English name; a
/// participant's own playlist is never named, since its name is typed by them.
/// </summary>
[ApiController]
[Route("api/admin/activity")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminActivityController(AccountsContext db, VeggieBookContext content) : ControllerBase
{
    private record Event(string Type, string? ResearchId, string Title, string Detail, DateTime At);

    private const int PreviewLength = 80;

    // What a participant did with a notification.
    private static readonly Dictionary<string, string> ParticipantNotification = new()
    {
        [NotificationActivity.Shown] = "Got the pop-up",
        [NotificationActivity.Opened] = "Read the message",
        [NotificationActivity.Link] = "Tapped the link",
        [NotificationActivity.Dismissed] = "Closed the pop-up"
    };

    // What an admin did with a notification.
    private static readonly Dictionary<string, string> AdminNotification = new()
    {
        [NotificationActivity.Created] = "Created notification",
        [NotificationActivity.Edited] = "Edited notification",
        [NotificationActivity.Stopped] = "Stopped notification"
    };

    // What an admin did with a playlist.
    private static readonly Dictionary<string, string> AdminPlaylist = new()
    {
        [PlaylistActivity.Created] = "Created playlist",
        [PlaylistActivity.Edited] = "Edited playlist",
        [PlaylistActivity.Archived] = "Archived playlist"
    };

    // What a participant did with a playlist made by an admin.
    private static readonly Dictionary<string, string> ParticipantPlaylist = new()
    {
        [PlaylistActivity.Opened] = "Opened the playlist",
        [PlaylistActivity.Kept] = "Kept the playlist",
        [PlaylistActivity.Skipped] = "Skipped the playlist",
        [PlaylistActivity.Removed] = "Removed the playlist"
    };

    // What a participant did with a playlist of their own.
    private static readonly Dictionary<string, string> OwnPlaylist = new()
    {
        [PlaylistActivity.OwnCreated] = "Made their own playlist",
        [PlaylistActivity.OwnEdited] = "Changed their own playlist",
        [PlaylistActivity.OwnDeleted] = "Deleted their own playlist"
    };

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? study)
    {
        var window = await StudyWindow.FindAsync(db, study);
        if (study is not null && window is null)
            return NotFound(new { error = $"There is no Study {study}. It may have been deleted." });

        var ids = await ParticipantIds.EnsureAsync(db);
        var userOf = ids.ToDictionary(kv => kv.Value, kv => kv.Key);
        var scope = await ResearchScope.LoadAsync(db);
        var people = await StudyTracking.PeopleAsync(db);

        var vegetableNames = await content.Vegetables.AsNoTracking().ToDictionaryAsync(v => v.Code, v => v.NameEn);
        var categoryNames = await content.SecretCategories.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.NameEn);

        var recipeNames = (await content.Recipes
                .AsNoTracking()
                .Select(r => new { r.Id, r.DisplayCode, r.TitleEn })
                .ToListAsync())
            .ToDictionary(r => r.Id, r => r.DisplayCode is null ? r.TitleEn : $"{r.DisplayCode} {r.TitleEn}");

        var secretNames = (await content.Secrets
                .AsNoTracking()
                .Select(s => new { s.Id, s.DisplayNumber, s.HeadlineEn })
                .ToListAsync())
            .ToDictionary(s => s.Id, s => $"#{s.DisplayNumber} {s.HeadlineEn}");

        var tipNames = (await content.Tips
                .AsNoTracking()
                .Select(t => new { t.Id, t.VegetableCode, t.HeadingEn })
                .ToListAsync())
            .ToDictionary(t => t.Id, t => $"{vegetableNames.GetValueOrDefault(t.VegetableCode, t.VegetableCode)}: {t.HeadingEn}");

        var notifications = await db.Notifications
            .AsNoTracking()
            .Select(n => new { n.Id, n.Title, n.BodyEn, n.RepeatDays })
            .ToDictionaryAsync(n => n.Id);

        var playlists = await db.Playlists
            .AsNoTracking()
            .Select(p => new
            {
                p.Id,
                p.NameEn,
                Tips = p.Items.Count(i => i.Kind == PlaylistKinds.Tip),
                Recipes = p.Items.Count(i => i.Kind == PlaylistKinds.Recipe)
            })
            .ToDictionaryAsync(p => p.Id);

        string Name(string kind, string? vegetableCode, int? categoryId) => kind == "secrets"
            ? (categoryId is int id ? categoryNames.GetValueOrDefault(id, "") : "")
            : (vegetableCode is string code ? vegetableNames.GetValueOrDefault(code, code) : "");

        // The message's title, or Untitled (#4) without one.
        string NotificationName(int? noteId) =>
            noteId is int i && notifications.TryGetValue(i, out var note) && !string.IsNullOrWhiteSpace(note.Title)
                ? note.Title!
                : $"Untitled (#{noteId})";

        // The start of the message, with the round for a repeating message.
        // Rounds are stored from 0 and shown from 1.
        string NotificationDetail(ActivityEntry a)
        {
            if (a.ContentId is not int noteId || !notifications.TryGetValue(noteId, out var note))
                return "Message no longer available";
            var text = Preview(note.BodyEn);
            return note.RepeatDays is not null && a.ItemCount is int round ? $"Round {round + 1}: {text}" : text;
        }

        string PlaylistName(int? playlistId) =>
            playlistId is int i && playlists.TryGetValue(i, out var p) ? p.NameEn : $"Playlist #{playlistId}";

        // "2 tips and 4 recipes", from what the playlist holds now.
        string PlaylistDetail(int? playlistId) =>
            playlistId is int i && playlists.TryGetValue(i, out var p)
                ? $"{Count(p.Tips, "tip")} and {Count(p.Recipes, "recipe")}"
                : "Playlist no longer available";

        string ItemName(string? itemKind, int? itemId) =>
            itemId is not int x ? ""
            : itemKind == PlaylistKinds.Tip ? tipNames.GetValueOrDefault(x, $"Tip {x}")
            : recipeNames.GetValueOrDefault(x, $"Recipe {x}");

        // Detail is "source:kind:id", for example "admin:recipe:212".
        (string Title, string Detail) ItemLine(ActivityEntry a)
        {
            var parts = (a.Detail ?? "").Split(':');
            var source = parts.ElementAtOrDefault(0);
            var itemKind = parts.ElementAtOrDefault(1);
            int? itemId = int.TryParse(parts.ElementAtOrDefault(2), out var n) ? n : null;

            var what = itemKind == PlaylistKinds.Tip ? "a tip" : "a recipe";
            var title = source == PlaylistActivity.SourceOwn
                ? $"Opened {what} in their own playlist"
                : $"Opened {what} in the playlist: {PlaylistName(a.ContentId)}";
            return (title, ItemName(itemKind, itemId));
        }

        // Detail is "kind|after|before", for example "recipe|Lunch and Dinner|Dinner".
        (string Title, string Detail) LabelLine(ActivityEntry a)
        {
            var parts = (a.Detail ?? "").Split('|');
            var labelKind = parts.ElementAtOrDefault(0);
            var after = parts.ElementAtOrDefault(1) ?? "";
            var before = parts.ElementAtOrDefault(2) ?? "";
            return ($"Changed meal labels: {ItemName(labelKind, a.ContentId)}", $"{after}, was {before}");
        }

        var events = new List<Event>();

        // Every saved book, deleted ones included. Kept at save includes items taken out later.
        var books = (await db.Books
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(b => people.Any(u => u.Id == b.UserId))
                .Select(b => new
                {
                    b.UserId,
                    b.Kind,
                    b.VegetableCode,
                    b.SecretCategoryId,
                    b.CreatedAt,
                    b.DropsRecorded,
                    Deleted = b.DeletedAt != null,
                    KeptAtSave = b.Selections.Count(s => !s.DroppedInReview),
                    Dropped = b.Selections.Count(s => s.DroppedInReview)
                })
                .ToListAsync())
            .Where(b => scope.CountsBook(b.UserId, b.CreatedAt))
            .ToList();

        var existing = books
            .Select(b => (ids.GetValueOrDefault(b.UserId, ""), b.CreatedAt))
            .ToHashSet();

        events.AddRange(books.Select(b => new Event(
            "book_saved",
            ids.GetValueOrDefault(b.UserId),
            BookTitle("Saved", Name(b.Kind, b.VegetableCode, b.SecretCategoryId), b.Kind),
            SaveDetail(b.KeptAtSave, b.DropsRecorded ? b.Dropped : null, b.Kind) + (b.Deleted ? ", deleted later" : ""),
            b.CreatedAt)));

        // New participants, by tracking state at the moment they joined.
        var joined = (await people.Select(u => new { u.Id, u.CreatedAt, u.AgeRange }).ToListAsync())
            .Where(u => scope.CountsBook(u.Id, u.CreatedAt));
        events.AddRange(joined.Select(u => new Event(
            "joined",
            ids.GetValueOrDefault(u.Id),
            "Joined",
            string.IsNullOrEmpty(u.AgeRange) ? "No age range given" : $"Age {u.AgeRange}",
            u.CreatedAt)));

        // Activity log: deletions, take-outs, prints, downloads, erases, admin
        // study actions, notifications, playlists, meal labels, and saves of
        // books no longer in the book table.
        var logged = await db.ActivityLog.AsNoTracking().ToListAsync();

        bool OwnerTracked(ActivityEntry a, DateTime at) =>
            !userOf.TryGetValue(a.ParticipantId, out var owner) || scope.CountsBook(owner, at);

        foreach (var a in logged)
        {
            var kind = a.BookKind ?? "veggie";
            var name = Name(kind, a.VegetableCode, a.SecretCategoryId);

            if (a.Kind == ActivityLog.StudyRenamed)
            {
                events.Add(new Event("study_renamed", null, $"Renamed Study {a.ItemCount}", a.Detail ?? "", a.At));
            }
            else if (a.Kind == ActivityLog.StudyDeleted)
            {
                events.Add(new Event("study_deleted", null, $"Deleted Study {a.ItemCount}", a.Detail ?? "", a.At));
            }
            else if (ParticipantNotification.TryGetValue(a.Kind, out var did))
            {
                if (OwnerTracked(a, a.At))
                    events.Add(new Event(a.Kind, a.ParticipantId, $"{did}: {NotificationName(a.ContentId)}",
                        NotificationDetail(a), a.At));
            }
            else if (AdminNotification.TryGetValue(a.Kind, out var adminDid))
            {
                events.Add(new Event(a.Kind, null, $"{adminDid}: {NotificationName(a.ContentId)}",
                    a.Detail ?? "", a.At));
            }
            else if (AdminPlaylist.TryGetValue(a.Kind, out var adminPlaylistDid))
            {
                events.Add(new Event(a.Kind, null, $"{adminPlaylistDid}: {PlaylistName(a.ContentId)}",
                    a.Detail ?? "", a.At));
            }
            else if (a.Kind == PlaylistActivity.MealLabelsChanged)
            {
                var (title, detail) = LabelLine(a);
                events.Add(new Event(a.Kind, null, title, detail, a.At));
            }
            else if (ParticipantPlaylist.TryGetValue(a.Kind, out var playlistDid))
            {
                if (OwnerTracked(a, a.At))
                {
                    var own = a.Detail == PlaylistActivity.SourceOwn;
                    events.Add(new Event(a.Kind, a.ParticipantId,
                        own ? "Opened their own playlist" : $"{playlistDid}: {PlaylistName(a.ContentId)}",
                        own ? (a.ItemCount is int c ? Count(c, "recipe") : "") : PlaylistDetail(a.ContentId),
                        a.At));
                }
            }
            else if (a.Kind == PlaylistActivity.ItemOpened)
            {
                if (OwnerTracked(a, a.At))
                {
                    var (title, detail) = ItemLine(a);
                    events.Add(new Event(a.Kind, a.ParticipantId, title, detail, a.At));
                }
            }
            else if (OwnPlaylist.TryGetValue(a.Kind, out var ownDid))
            {
                if (OwnerTracked(a, a.At))
                    events.Add(new Event(a.Kind, a.ParticipantId, ownDid,
                        a.ItemCount is int c ? Count(c, "recipe") : "", a.At));
            }
            else if (a.Kind == ParticipantErase.Kind)
            {
                var n = a.ItemCount ?? 0;
                var booksText = n == 1 ? "1 book" : $"{n} books";
                var (title, detail) = a.Detail switch
                {
                    ParticipantErase.Everything => ("Everything erased by the main admin",
                        $"{booksText}, the account and all tracking data erased"),
                    ParticipantErase.Account => ("Account and books erased by the main admin",
                        $"{booksText} and the account erased, tracking history kept"),
                    _ => ("Books erased by the main admin",
                        $"{booksText} erased, account kept, tracking turned off")
                };
                events.Add(new Event("research_erased", a.ParticipantId, title, detail, a.At));
            }
            else if (a.Kind == ActivityLog.AccountDeleted)
            {
                events.Add(ActivityLog.IsRemovedByAdmin(a)
                    ? new Event("account_deleted", a.ParticipantId, "Account removed by an admin",
                        "Admin action, research data kept", a.At)
                    : new Event("account_deleted", a.ParticipantId, "Deleted their account",
                        "Account removed, research data kept", a.At));
            }
            else if (a.Kind == ActivityLog.BookDeleted && OwnerTracked(a, a.At))
            {
                events.Add(new Event("book_deleted", a.ParticipantId, BookTitle("Deleted", name, kind),
                    a.ItemCount is int n ? "Had " + Items(n, kind) : "Book removed", a.At));
            }
            else if (a.Kind == ActivityLog.ItemRemoved && OwnerTracked(a, a.At))
            {
                events.Add(new Event("item_removed", a.ParticipantId,
                    BookTitle($"Took {Items(a.ItemCount ?? 1, kind)} out of", name, kind),
                    "From a saved book", a.At));
            }
            else if ((a.Kind == ActivityLog.BookPrinted || a.Kind == ActivityLog.BookDownloaded)
                     && OwnerTracked(a, a.At))
            {
                var verb = a.Kind == ActivityLog.BookPrinted ? "Printed" : "Downloaded";
                var book = BookName(name, kind);
                var (title, detail) = a.Detail switch
                {
                    ActivityLog.ScopeRecipe => ($"{verb} a recipe from {book}",
                        a.ContentId is int r ? recipeNames.GetValueOrDefault(r, $"Recipe {r}") : "One recipe"),
                    ActivityLog.ScopeSecret => ($"{verb} a secret from {book}",
                        a.ContentId is int s ? secretNames.GetValueOrDefault(s, $"Secret {s}") : "One secret"),
                    ActivityLog.ScopeExtras => ($"{verb} extra copies from {book}",
                        a.ItemCount is int c ? (c == 1 ? "1 extra copy" : $"{c} extra copies") : "Extra copies"),
                    _ => ($"{verb} {book}",
                        a.ItemCount is int n ? "Whole book, " + Items(n, kind) : "Whole book")
                };
                events.Add(new Event(a.Kind, a.ParticipantId, title, detail, a.At));
            }
            else if (a.Kind == ActivityLog.BookSaved && !existing.Contains((a.ParticipantId, a.At)) && OwnerTracked(a, a.At))
            {
                events.Add(new Event("book_saved", a.ParticipantId, BookTitle("Saved", name, kind),
                    (a.ItemCount is int n ? SaveDetail(n, a.TakenOutCount, kind) : "Book saved") + ", deleted later",
                    a.At));
            }
        }

        // Tracking changes.
        var peopleIds = await people.Select(u => u.Id).ToListAsync();
        var changes = await db.TrackingChanges.AsNoTracking().Where(c => peopleIds.Contains(c.UserId)).ToListAsync();
        events.AddRange(changes.Select(c => new Event(
            c.TrackingOn ? "tracking_on" : "tracking_off",
            ids.GetValueOrDefault(c.UserId),
            c.ChangedBy == "admin"
                ? (c.TrackingOn ? "Tracking turned back on by an admin" : "Tracking turned off by an admin")
                : (c.TrackingOn ? "Turned tracking on" : "Turned tracking off"),
            c.ChangedBy == "admin" ? "Admin action" : "In Settings, by the participant",
            c.At)));

        // Studies.
        var studies = await db.Studies.AsNoTracking().ToListAsync();
        foreach (var s in studies)
        {
            var title = $"{StudyData.TitleOf(s)}" + (string.IsNullOrWhiteSpace(s.Name) ? "" : $" (Study {s.Number})");
            events.Add(new Event("study_started", null, $"Started {title}", "Switched on by an admin", s.StartedAt));
            if (s.EndedAt is DateTime ended)
                events.Add(new Event("study_ended", null, $"Ended {title}", "Switched off by an admin", ended));
        }

        // Study notice answers.
        var studyTitle = studies.ToDictionary(s => s.Id, s => StudyData.TitleOf(s));
        var notices = await db.StudyNotices.AsNoTracking()
            .Where(n => n.AnsweredAt != null && peopleIds.Contains(n.UserId))
            .ToListAsync();
        events.AddRange(notices.Select(n => new Event(
            n.Answer == "joined" ? "notice_joined" : "notice_declined",
            ids.GetValueOrDefault(n.UserId),
            n.Answer == "joined"
                ? $"Joined {studyTitle.GetValueOrDefault(n.StudyId, "a study")} from the notice"
                : $"Chose not now for {studyTitle.GetValueOrDefault(n.StudyId, "a study")}",
            "Study notice answered",
            n.AnsweredAt!.Value)));

        var result = events
            .Where(e => window is null || (e.At >= window.StartedAt && (window.EndedAt is null || e.At <= window.EndedAt)))
            .OrderByDescending(e => e.At)
            .Select(e => new
            {
                type = e.Type,
                researchId = e.ResearchId,
                title = e.Title,
                detail = e.Detail,
                at = DateTime.SpecifyKind(e.At, DateTimeKind.Utc)
            })
            .ToList();

        Response.Headers.CacheControl = "no-store";
        return Ok(new { events = result });
    }

    // "6 recipes kept, 4 taken out", "6 recipes kept" when nothing was dropped,
    // or "6 recipes kept, taken out while making: -" when drops were not recorded.
    private static string SaveDetail(int kept, int? takenOut, string kind) =>
        Items(kept, kind) + " kept" + takenOut switch
        {
            null => ", taken out while making: -",
            > 0 => $", {takenOut} taken out",
            _ => ""
        };

    // "a Cabbage VeggieBook", "a Shopping Secrets Book".
    private static string BookName(string name, string kind)
    {
        var type = kind == "secrets" ? "Secrets Book" : "VeggieBook";
        if (string.IsNullOrWhiteSpace(name)) return $"a {type}";
        if (kind == "secrets" && name.EndsWith("Secrets", StringComparison.OrdinalIgnoreCase))
            return $"a {name} Book";
        return $"a {name} {type}";
    }

    private static string BookTitle(string verb, string name, string kind) => $"{verb} {BookName(name, kind)}";

    private static string Items(int n, string kind)
    {
        var word = kind == "secrets" ? "secret" : "recipe";
        return n == 1 ? $"1 {word}" : $"{n} {word}s";
    }

    private static string Count(int n, string word) => n == 1 ? $"1 {word}" : $"{n} {word}s";

    // The message on one line, cut to PreviewLength characters.
    private static string Preview(string text)
    {
        var line = string.Join(' ', text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        return line.Length <= PreviewLength ? line : line[..PreviewLength].TrimEnd() + "...";
    }
}