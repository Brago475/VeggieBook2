namespace VeggieBook.Api.Data;

// Entities for user data, mapped onto tables created by db/migrations.
//
// Kept apart from Entities.cs on purpose: those classes are read-only
// content loaded from the original app, while these are written by users.
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

// A saved book, stored in book_session. Belongs to exactly one account.
// Deleting the account deletes its books through the database's
// ON DELETE CASCADE (db/migrations/002_books.sql), so there is no
// relationship to AppUser in code: the database enforces it.
public class Book
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Kind { get; set; } = "veggie";   // veggie or secrets
    public string Language { get; set; } = "en";
    public string? VegetableCode { get; set; }

    // A preset cover such as cover/BR.jpg. Null when the cover is an upload.
    public string? CoverPath { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<BookAttribute> Attributes { get; set; } = [];
    public List<BookSelection> Selections { get; set; } = [];
    public BookCoverUpload? CoverUpload { get; set; }
}

// One answer the user chose on the profiling questions.
public class BookAttribute
{
    public Guid SessionId { get; set; }
    public string Attribute { get; set; } = "";
}

// One piece of content in the book. Only kept recipes are stored for now.
// The table can also hold dropped recipes (Kept = false), tips, or secrets,
// if the study decides it wants those recorded.
public class BookSelection
{
    public Guid SessionId { get; set; }
    public string ContentType { get; set; } = "recipe";
    public int ContentId { get; set; }
    public bool Kept { get; set; }
    public int ExtraCopies { get; set; }
}

// The user's own cover photo. Private: served only to the book's owner.
public class BookCoverUpload
{
    public Guid SessionId { get; set; }
    public string ContentType { get; set; } = "image/jpeg";
    public byte[] Data { get; set; } = [];
}