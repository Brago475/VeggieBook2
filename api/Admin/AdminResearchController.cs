using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;
using VeggieBook.Api.Research;

namespace VeggieBook.Api.Admin;

// The research sheets for the admin site's Research page.
//
//   GET /api/admin/research/participants    one row per participant
//
// Admins only (Roles.AdminPolicy).
//
// Every row is keyed by the anonymous research ID (Research/ParticipantIds.cs).
// No email, name, username, or account ID is read or sent here. The join
// date is given as a month only, so it can't single anyone out.
//
// Admin accounts are left out: their books are tests, not research data.
// Guests are left out: they are temporary.
//
// More sheets (one row per book) and exports (Excel, CSV, SPSS, PDF) come
// next.

[ApiController]
[Route("api/admin/research")]
[Authorize(Policy = Roles.AdminPolicy)]
public class AdminResearchController(AccountsContext db) : ControllerBase
{
    [HttpGet("participants")]
    public async Task<IActionResult> Participants()
    {
        var ids = await ParticipantIds.EnsureAsync(db);

        var adminRoleId = await db.Roles
            .Where(r => r.Name == Roles.Admin)
            .Select(r => r.Id)
            .FirstAsync();

        var users = await db.Users
            .AsNoTracking()
            .Where(u => u.GuestExpiresAt == null
                     && !db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == adminRoleId))
            .Select(u => new { u.Id, u.CreatedAt, u.AgeRange })
            .ToListAsync();

        var books = (await db.Books
                .AsNoTracking()
                .Select(b => new
                {
                    b.UserId,
                    b.Kind,
                    b.CreatedAt,
                    Selections = b.Selections
                        .Select(s => new { s.ContentType, s.Kept })
                        .ToList()
                })
                .ToListAsync())
            .ToLookup(b => b.UserId);

        var rows = users
            .Where(u => ids.ContainsKey(u.Id))
            .Select(u =>
            {
                var own = books[u.Id].ToList();
                var sel = own.SelectMany(b => b.Selections).ToList();
                return new
                {
                    participantId = ids[u.Id],
                    ageRange = string.IsNullOrEmpty(u.AgeRange) ? null : u.AgeRange,
                    joinedMonth = u.CreatedAt.ToString("yyyy-MM"),
                    books = own.Count,
                    veggieBooks = own.Count(b => b.Kind == "veggie"),
                    secretsBooks = own.Count(b => b.Kind == "secrets"),
                    recipesKept = sel.Count(s => s.ContentType == "recipe" && s.Kept),
                    recipesRemoved = sel.Count(s => s.ContentType == "recipe" && !s.Kept),
                    secretsKept = sel.Count(s => s.ContentType == "secret" && s.Kept),
                    secretsRemoved = sel.Count(s => s.ContentType == "secret" && !s.Kept),
                    firstBookAt = own.Count == 0 ? (DateTime?)null : own.Min(b => b.CreatedAt),
                    lastBookAt = own.Count == 0 ? (DateTime?)null : own.Max(b => b.CreatedAt)
                };
            })
            .OrderBy(r => r.participantId)
            .ToList();

        return Ok(new { generatedAt = DateTime.UtcNow, rows });
    }
}