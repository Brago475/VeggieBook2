using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.Data;

// Database context for user data: accounts and saved books.
//
// Separate from VeggieBookContext, which is read-only with tracking switched
// off. Keeping writes in their own context means the content endpoints never
// gain a write path, and user data never mixes with content queries.
//
// Same rules as the content context: no EF migrations, snake_case mapped
// explicitly, and db/migrations is the source of truth for these tables.

public class AccountsContext(DbContextOptions<AccountsContext> options)
    : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<BookCoverUpload> BookCoverUploads => Set<BookCoverUpload>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<AppUser>(e =>
        {
            e.ToTable("app_user");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.Email).HasColumnName("email");
            e.Property(x => x.EmailNormalized).HasColumnName("email_normalized");
            e.Property(x => x.PasswordHash).HasColumnName("password_hash");
            e.Property(x => x.SecurityStamp).HasColumnName("security_stamp");
            e.Property(x => x.FailedSignIns).HasColumnName("failed_sign_ins");
            e.Property(x => x.LockedUntil).HasColumnName("locked_until");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        b.Entity<Book>(e =>
        {
            e.ToTable("book_session");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Kind).HasColumnName("kind");
            e.Property(x => x.Language).HasColumnName("language");
            e.Property(x => x.VegetableCode).HasColumnName("vegetable_code");
            e.Property(x => x.CoverPath).HasColumnName("cover_path");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");

            e.HasMany(x => x.Attributes).WithOne().HasForeignKey(x => x.SessionId);
            e.HasMany(x => x.Selections).WithOne().HasForeignKey(x => x.SessionId);
            e.HasOne(x => x.CoverUpload)
             .WithOne()
             .HasForeignKey<BookCoverUpload>(x => x.SessionId);
        });

        b.Entity<BookAttribute>(e =>
        {
            e.ToTable("book_session_attribute");
            e.HasKey(x => new { x.SessionId, x.Attribute });
            e.Property(x => x.SessionId).HasColumnName("session_id");
            e.Property(x => x.Attribute).HasColumnName("attribute");
        });

        b.Entity<BookSelection>(e =>
        {
            e.ToTable("book_session_selection");
            e.HasKey(x => new { x.SessionId, x.ContentType, x.ContentId });
            e.Property(x => x.SessionId).HasColumnName("session_id");
            e.Property(x => x.ContentType).HasColumnName("content_type");
            e.Property(x => x.ContentId).HasColumnName("content_id");
            e.Property(x => x.Kept).HasColumnName("kept");
            e.Property(x => x.ExtraCopies).HasColumnName("extra_copies");
        });

        b.Entity<BookCoverUpload>(e =>
        {
            e.ToTable("book_cover_upload");
            e.HasKey(x => x.SessionId);
            e.Property(x => x.SessionId).HasColumnName("session_id");
            e.Property(x => x.ContentType).HasColumnName("content_type");
            e.Property(x => x.Data).HasColumnName("data");
        });
    }
}