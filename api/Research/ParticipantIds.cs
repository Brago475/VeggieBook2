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
}