using Microsoft.AspNetCore.Identity;

namespace VeggieBook.Api.Data;

// Entities for user data, mapped onto tables created by db/migrations.
//
// Kept apart from Entities.cs on purpose: those classes are read-only
// content loaded from the original app, while these are written by users.
//
// Timestamps are DateTime in UTC. Npgsql maps timestamptz to DateTime and
// requires Kind=Utc, so always assign DateTime.UtcNow, never DateTime.Now.

// An account. ASP.NET Core Identity supplies the standard fields: email,
// email confirmation, password hash, security stamp, lockout, and so on.
// Identity manages all of them; nothing here touches them by hand.
//
// UserName is always set to the email address. Identity requires a user
// name, and VeggieBook2 signs in by email only. The name people see is
// DisplayName (the username on the Create Account form).
//
// Column names come from AccountsContext, which turns every property name
// into snake_case (RecoveryPinHash becomes recovery_pin_hash).
public class AppUser : IdentityUser<Guid>
{
    public DateTime CreatedAt { get; set; }

    // Set only on guest accounts: when the cleanup job deletes it.
    // See Auth/GuestAccounts.cs.
    public DateTime? GuestExpiresAt { get; set; }

    // Set on a new account whose owner chose to keep their guest books.
    public Guid? PendingGuestId { get; set; }

    // The profile from the Create Account form.
    // See db/migrations/005_profile.sql and Auth/SignUpRules.cs.
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? AgeRange { get; set; }
    public string? TermsVersion { get; set; }
    public DateTime? TermsAcceptedAt { get; set; }

    // Account recovery. See Auth/AccountRecovery.cs and
    // db/migrations/004_recovery.sql.
    public string? RecoveryPinHash { get; set; }
    public int? SecurityQuestionId { get; set; }
    public string? SecurityAnswerHash { get; set; }

    public int PinFailedCount { get; set; }
    public DateTime? PinFailWindowStart { get; set; }
    public int AnswerFailedCount { get; set; }
    public DateTime? AnswerFailWindowStart { get; set; }

    // Set when password reset is locked for this account.
    public DateTime? RecoveryLockedAt { get; set; }
}

// A role: Guest, User, or Admin. See Auth/Roles.cs.
public class AppRole : IdentityRole<Guid>
{
    public AppRole() { }
    public AppRole(string name) : base(name) { }
}

// A saved book, stored in book_session. Belongs to exactly one account.
// Deleting the account deletes its books through the database's
// ON DELETE CASCADE (db/migrations/003_identity.sql), so there is no
// relationship to AppUser in code: the database enforces it.
//
// A VeggieBook names its vegetable (VegetableCode); a Secrets Book names its
// category (SecretCategoryId). Each kind leaves the other one null.
public class Book
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Kind { get; set; } = "veggie";   // veggie or secrets
    public string Language { get; set; } = "en";
    public string? VegetableCode { get; set; }

    // Added by db/fixes/009_book_session_secret_category.sql.
    public int? SecretCategoryId { get; set; }

    // A preset cover such as cover/BR.jpg, or for a Secrets Book one of its
    // secrets' pictures. Null when the cover is an upload.
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

// One piece of content in the book. Only kept recipes and kept secrets are
// stored for now. The table can also hold dropped ones (Kept = false) or
// tips, if the study decides it wants those recorded.
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