using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research.AllData;

// One study, used as a filter for the All Data files and the Studies page.
//
// A book belongs to a study when:
//   it was saved after the study was switched on,
//   and before it was switched off (or any time so far, while it runs),
//   and the person's tracking was on at the moment they saved it.
//
// The same rule StudyData.Summary uses for booksSaved, so the count on the
// Studies page and the rows in the files always match. Admins and guests
// are already left out by AllDataSource.

public sealed class StudyWindow
{
    public required int Number { get; init; }
    public string? Name { get; init; }
    public required DateTime StartedAt { get; init; }
    public DateTime? EndedAt { get; init; }
    public required TrackingHistory History { get; init; }

    // The study with this number, or null if there is none (or no number).
    public static async Task<StudyWindow?> FindAsync(AccountsContext db, int? number)
    {
        if (number is null) return null;

        var study = await db.Studies
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Number == number);
        if (study is null) return null;

        return new StudyWindow
        {
            Number = study.Number,
            Name = study.Name,
            StartedAt = study.StartedAt,
            EndedAt = study.EndedAt,
            History = await TrackingHistory.LoadAsync(db)
        };
    }

    // savedAt is the book's CreatedAt, in UTC like the study's dates.
    public bool Includes(Guid userId, DateTime savedAt) =>
        savedAt >= StartedAt
        && (EndedAt is null || savedAt <= EndedAt)
        && History.At(userId, savedAt).On;

    // For the files' About tab and README:
    // "Fall pilot (Study 3), 2026-10-11 to now (Eastern), ...".
    public string Describe()
    {
        var start = Local(StartedAt).ToString("yyyy-MM-dd");
        var end = EndedAt is null ? "now (still running)" : Local(EndedAt.Value).ToString("yyyy-MM-dd");
        var title = string.IsNullOrWhiteSpace(Name) ? $"Study {Number}" : $"{Name} (Study {Number})";
        return $"{title}, {start} to {end} ({AllDataSource.Local.Name}), "
             + "only books saved while the person's tracking was on";
    }

    private static DateTime Local(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), AllDataSource.Local.Zone);
}