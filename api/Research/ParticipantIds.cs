using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Research;

// Anonymous research IDs (VB2-K7M4-Q9PX), one per real account.
//
// EnsureAsync gives an ID to every real account that doesn't have one yet,
// then returns them all. The research endpoints call it before building a
// sheet, so new accounts appear with an ID the first time a sheet loads.
// Guests never get one.
//
// ForUserAsync does the same for one account, for the activity log, which
// needs the ID at the moment a book or account is deleted.
//
// The characters come from a cryptographic random source, so an ID says
// nothing about the account or when it was made. 31 characters, 8 places:
// about 850 billion possible IDs, so a clash is practically impossible, and
// the database's unique index catches it if one ever happens.
//
// See db/migrations/006_research_participant.sql.

public static class ParticipantIds
{
    // 2-9 and letters other than I, L, and O, so no two look alike.
    private const string Alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

    public static string NewId()
    {
        Span<char> c = stackalloc char[8];
        for (var i = 0; i < c.Length; i++)
            c[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        return $"VB2-{new string(c[..4])}-{new string(c[4..])}";
    }

    public static async Task<Dictionary<Guid, string>> EnsureAsync(AccountsContext db)
    {
        var ids = await db.ResearchParticipants
            .AsNoTracking()
            .ToDictionaryAsync(p => p.UserId, p => p.ParticipantId);

        var missing = await db.Users
            .AsNoTracking()
            .Where(u => u.GuestExpiresAt == null
                     && !db.ResearchParticipants.Any(p => p.UserId == u.Id))
            .Select(u => u.Id)
            .ToListAsync();

        if (missing.Count == 0) return ids;

        var used = ids.Values.ToHashSet();
        var now = DateTime.UtcNow;
        foreach (var userId in missing)
        {
            string id;
            do { id = NewId(); } while (!used.Add(id));

            db.ResearchParticipants.Add(new ResearchParticipant
            {
                UserId = userId,
                ParticipantId = id,
                CreatedAt = now
            });
            ids[userId] = id;
        }

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Two admins loaded a sheet at the same moment and both gave
            // the same new account an ID. The other one's was saved first,
            // so drop ours and read back what is stored.
            db.ChangeTracker.Clear();
            ids = await db.ResearchParticipants
                .AsNoTracking()
                .ToDictionaryAsync(p => p.UserId, p => p.ParticipantId);
        }

        return ids;
    }

    // One account's ID, made now if it doesn't have one yet. Only the new
    // ID row is added and saved, so anything else the context is tracking
    // (such as an account about to be deleted) is left alone.
    public static async Task<string> ForUserAsync(AccountsContext db, Guid userId)
    {
        var existing = await db.ResearchParticipants
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => p.ParticipantId)
            .FirstOrDefaultAsync();
        if (existing is not null) return existing;

        var used = (await db.ResearchParticipants
                .AsNoTracking()
                .Select(p => p.ParticipantId)
                .ToListAsync())
            .ToHashSet();

        string id;
        do { id = NewId(); } while (used.Contains(id));

        var row = new ResearchParticipant { UserId = userId, ParticipantId = id, CreatedAt = DateTime.UtcNow };
        db.ResearchParticipants.Add(row);

        try
        {
            await db.SaveChangesAsync();
            return id;
        }
        catch (DbUpdateException)
        {
            // Someone else gave this account an ID at the same moment. Drop
            // ours and use theirs.
            db.Entry(row).State = EntityState.Detached;
            return await db.ResearchParticipants
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .Select(p => p.ParticipantId)
                .FirstAsync();
        }
    }
}