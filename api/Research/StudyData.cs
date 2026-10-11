using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// What the Studies and Participants pages need, loaded once per request:
// the people a study can include (real accounts, no admins, no guests),
// their research IDs, their tracking history, their books, and the notices.
//
// Summary builds one study's numbers:
//
//   people       accounts that existed by the study's end (or now)
//   tracked      of those, how many had tracking on at that moment
//   offIds       the research IDs of those with it off, and who turned it
//                off (the person or an admin); nothing else about them
//   notice       how many saw the notice, joined, or stayed out
//   booksSaved   books saved during the study by people who were tracked
//                at the moment they saved it
//
// Preview gives the same tracked and off counts for a study switched on
// right now, for the confirm step before switching one on.

public sealed class StudyData
{
    public record Person(Guid Id, DateTime CreatedAt, string? AgeRange);
    public record BookRow(Guid UserId, string Kind, DateTime CreatedAt);
    public record OffPerson(string ResearchId, string By, DateTime? Since);

    public required List<Person> People { get; init; }
    public required TrackingHistory History { get; init; }
    public required List<BookRow> Books { get; init; }
    public required List<StudyNotice> Notices { get; init; }
    public required Dictionary<Guid, string> Ids { get; init; }

    public static async Task<StudyData> LoadAsync(AccountsContext db)
    {
        // Research IDs first: this gives one to any account that doesn't
        // have one yet, the same way the research sheets do.
        var ids = await ParticipantIds.EnsureAsync(db);

        var people = await (await StudyTracking.PeopleAsync(db))
            .Select(u => new Person(u.Id, u.CreatedAt, u.AgeRange))
            .ToListAsync();

        var peopleIds = people.Select(p => p.Id).ToList();

        var books = await db.Books
            .AsNoTracking()
            .Where(b => peopleIds.Contains(b.UserId))
            .Select(b => new BookRow(b.UserId, b.Kind, b.CreatedAt))
            .ToListAsync();

        var notices = await db.StudyNotices.AsNoTracking().ToListAsync();
        var history = await TrackingHistory.LoadAsync(db);

        return new StudyData
        {
            People = people,
            History = history,
            Books = books,
            Notices = notices,
            Ids = ids
        };
    }

    public string IdOf(Guid userId) => Ids.GetValueOrDefault(userId) ?? "";

    public object Preview(DateTime now)
    {
        var off = OffAt(now, People);
        return new
        {
            people = People.Count,
            tracked = People.Count - off.Count,
            trackingOff = off.Count,
            offIds = off
        };
    }

    public object Summary(Study study, DateTime now)
    {
        var end = study.EndedAt ?? now;
        var present = People.Where(p => p.CreatedAt <= end).ToList();
        var presentIds = present.Select(p => p.Id).ToHashSet();
        var off = OffAt(end, present);
        var notices = Notices.Where(n => n.StudyId == study.Id).ToList();

        var booksSaved = Books.Count(b =>
            b.CreatedAt >= study.StartedAt
            && b.CreatedAt <= end
            && presentIds.Contains(b.UserId)
            && History.At(b.UserId, b.CreatedAt).On);

        return new
        {
            id = study.Id,
            number = study.Number,
            startedAt = study.StartedAt,
            endedAt = study.EndedAt,
            running = study.EndedAt is null,
            // Day 1 is the day it was switched on.
            days = (int)(end - study.StartedAt).TotalDays + 1,
            people = present.Count,
            tracked = present.Count - off.Count,
            trackingOff = off.Count,
            offIds = off,
            notice = new
            {
                shown = notices.Count,
                joined = notices.Count(n => n.Answer == "joined"),
                stayedOut = notices.Count(n => n.Answer == "stayed_out")
            },
            booksSaved
        };
    }

    private List<OffPerson> OffAt(DateTime when, IEnumerable<Person> people) =>
        people
            .Select(p => (Person: p, State: History.At(p.Id, when)))
            .Where(x => !x.State.On)
            .Select(x => new OffPerson(IdOf(x.Person.Id), x.State.ChangedBy ?? "self", x.State.ChangedAt))
            .OrderBy(x => x.ResearchId)
            .ToList();
}