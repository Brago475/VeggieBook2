namespace VeggieBook.Api.Data;

// Entities for user data, mapped onto tables created by db/migrations.
//
// Kept apart from Entities.cs on purpose: those classes are read-only
// content loaded from the original app, while these are written by users.
// Saved books will be added to this file.
//
// Timestamps are DateTime in UTC. Npgsql maps timestamptz to DateTime and
// requires Kind=Utc, so always assign DateTime.UtcNow, never DateTime.Now.

public class AppUser
{
    public Guid Id { get; set; }

    // As typed, for display.
    public string Email { get; set; } = "";

    // Trimmed and lowercased. This is what sign-in looks up, and the
    // database enforces that it is unique.
    public string EmailNormalized { get; set; } = "";

    // PasswordHasher output. The password itself is never stored.
    public string PasswordHash { get; set; } = "";

    // Replaced on password change. Session cookies carry the stamp they were
    // issued with, and a mismatch signs that session out.
    public Guid SecurityStamp { get; set; }

    public int FailedSignIns { get; set; }
    public DateTime? LockedUntil { get; set; }
    public DateTime CreatedAt { get; set; }
}