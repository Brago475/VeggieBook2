using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.Data;

// Database context for user data: accounts, roles, saved books, research
// IDs, and the activity log.
//
// Separate from VeggieBookContext, which is read-only with tracking switched
// off. Keeping writes in their own context means the content endpoints never
// gain a write path, and user data never mixes with content queries.
//
// Same rules as the content context: no EF migrations, snake_case names, and
// db/migrations is the source of truth for these tables. Identity's own
// tables are renamed below to match db/migrations/003_identity.sql.

public class AccountsContext(DbContextOptions<AccountsContext> options)
    : IdentityDbContext<AppUser, AppRole, Guid>(options)
{
    public DbSet<Book> Books => Set<Book>();
    public DbSet<BookCoverUpload> BookCoverUploads => Set<BookCoverUpload>();
    public DbSet<ResearchParticipant> ResearchParticipants => Set<ResearchParticipant>();
    public DbSet<ActivityEntry> ActivityLog => Set<ActivityEntry>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Identity's model first, then our names on top of it.
        base.OnModelCreating(b);

        b.Entity<AppUser>().ToTable("app_user");
        b.Entity<AppRole>().ToTable("app_role");
        b.Entity<IdentityUserRole<Guid>>().ToTable("app_user_role");
        b.Entity<IdentityUserClaim<Guid>>().ToTable("app_user_claim");
        b.Entity<IdentityUserLogin<Guid>>().ToTable("app_user_login");
        b.Entity<IdentityUserToken<Guid>>().ToTable("app_user_token");
        b.Entity<IdentityRoleClaim<Guid>>().ToTable("app_role_claim");

        // Identity names its columns in PascalCase (NormalizedEmail). Ours
        // are snake_case (normalized_email), so convert every Identity column.
        Type[] identityTypes =
        [
            typeof(AppUser),
            typeof(AppRole),
            typeof(IdentityUserRole<Guid>),
            typeof(IdentityUserClaim<Guid>),
            typeof(IdentityUserLogin<Guid>),
            typeof(IdentityUserToken<Guid>),
            typeof(IdentityRoleClaim<Guid>)
        ];
        foreach (var type in identityTypes)
        {
            var entity = b.Model.FindEntityType(type)!;
            foreach (var property in entity.GetProperties())
                property.SetColumnName(ToSnakeCase(property.Name));
        }

        b.Entity<Book>(e =>
        {
            e.ToTable("book_session");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Kind).HasColumnName("kind");
            e.Property(x => x.Language).HasColumnName("language");
            e.Property(x => x.VegetableCode).HasColumnName("vegetable_code");
            e.Property(x => x.SecretCategoryId).HasColumnName("secret_category_id");
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

        // See db/migrations/006_research_participant.sql.
        b.Entity<ResearchParticipant>(e =>
        {
            e.ToTable("research_participant");
            e.HasKey(x => x.UserId);
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.ParticipantId).HasColumnName("participant_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        // See db/migrations/007_activity_log.sql.
        b.Entity<ActivityEntry>(e =>
        {
            e.ToTable("activity_log");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.At).HasColumnName("at");
            e.Property(x => x.Kind).HasColumnName("kind");
            e.Property(x => x.ParticipantId).HasColumnName("participant_id");
            e.Property(x => x.BookKind).HasColumnName("book_kind");
            e.Property(x => x.VegetableCode).HasColumnName("vegetable_code");
            e.Property(x => x.SecretCategoryId).HasColumnName("secret_category_id");
            e.Property(x => x.ItemCount).HasColumnName("item_count");
        });
    }

    // NormalizedUserName becomes normalized_user_name.
    private static string ToSnakeCase(string name)
    {
        var sb = new System.Text.StringBuilder(name.Length + 8);
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c) && i > 0) sb.Append('_');
            sb.Append(char.ToLowerInvariant(c));
        }
        return sb.ToString();
    }
}