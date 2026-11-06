using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.Data;

// Database context for user data: accounts, roles, saved books, research
// IDs, studies and tracking, the activity log, and notifications.
//
// Separate from VeggieBookContext, which is read-only with tracking switched
// off. Keeping writes in their own context means the content endpoints never
// gain a write path, and user data never mixes with content queries.
//
// Same rules as the content context: no EF migrations, snake_case names, and
// db/migrations is the source of truth for these tables. Identity's own
// tables are renamed below to match db/migrations/003_identity.sql.
//
// Deleted accounts and books are hidden by query filters, so the app never
// sees them. Research code reads them with IgnoreQueryFilters().

public class AccountsContext(DbContextOptions<AccountsContext> options)
    : IdentityDbContext<AppUser, AppRole, Guid>(options)
{
    public DbSet<Book> Books => Set<Book>();
    public DbSet<BookCoverUpload> BookCoverUploads => Set<BookCoverUpload>();
    public DbSet<ResearchParticipant> ResearchParticipants => Set<ResearchParticipant>();
    public DbSet<ActivityEntry> ActivityLog => Set<ActivityEntry>();
    public DbSet<TrackingChange> TrackingChanges => Set<TrackingChange>();
    public DbSet<Study> Studies => Set<Study>();
    public DbSet<StudyNotice> StudyNotices => Set<StudyNotice>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationTarget> NotificationTargets => Set<NotificationTarget>();
    public DbSet<NotificationReceipt> NotificationReceipts => Set<NotificationReceipt>();

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

        // Deleted accounts are invisible to sign-in, the app, and admin
        // account pages. See db/migrations/014_keep_research_on_delete.sql.
        b.Entity<AppUser>().HasQueryFilter(u => u.DeletedAt == null);

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
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");           // 014
            e.Property(x => x.HadUpload).HasColumnName("had_upload");           // 014
            e.Property(x => x.DropsRecorded).HasColumnName("drops_recorded");   // 015

            // Deleted books kept for research are hidden from the app.
            e.HasQueryFilter(x => x.DeletedAt == null);

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
            e.Property(x => x.DroppedInReview).HasColumnName("dropped_in_review"); // 013
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

        // See db/migrations/007, 010, 013, 015 and 016.
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
            e.Property(x => x.BookId).HasColumnName("book_id");         // 016
            e.Property(x => x.ItemCount).HasColumnName("item_count");
            e.Property(x => x.TakenOutCount).HasColumnName("taken_out_count");
            e.Property(x => x.ContentId).HasColumnName("content_id");   // 015
            e.Property(x => x.Detail).HasColumnName("detail");
        });

        // See db/migrations/008_studies.sql.
        b.Entity<TrackingChange>(e =>
        {
            e.ToTable("research_tracking_change");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.TrackingOn).HasColumnName("tracking_on");
            e.Property(x => x.ChangedBy).HasColumnName("changed_by");
            e.Property(x => x.AdminId).HasColumnName("admin_id");
            e.Property(x => x.At).HasColumnName("at");
        });

        b.Entity<Study>(e =>
        {
            e.ToTable("study");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.Number).HasColumnName("number");
            e.Property(x => x.StartedAt).HasColumnName("started_at");
            e.Property(x => x.EndedAt).HasColumnName("ended_at");
            e.Property(x => x.StartedBy).HasColumnName("started_by");
            e.Property(x => x.EndedBy).HasColumnName("ended_by");
            e.Property(x => x.Name).HasColumnName("name"); // 009_study_name.sql
        });

        b.Entity<StudyNotice>(e =>
        {
            e.ToTable("study_notice");
            e.HasKey(x => new { x.StudyId, x.UserId });
            e.Property(x => x.StudyId).HasColumnName("study_id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.ShownAt).HasColumnName("shown_at");
            e.Property(x => x.Answer).HasColumnName("answer");
            e.Property(x => x.AnsweredAt).HasColumnName("answered_at");
        });

        // See db/migrations/019_notifications.sql and 020.
        b.Entity<Notification>(e =>
        {
            e.ToTable("notification");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.BodyEn).HasColumnName("body_en");
            e.Property(x => x.BodyEs).HasColumnName("body_es");
            e.Property(x => x.TemplateKey).HasColumnName("template_key");
            e.Property(x => x.Vegetable).HasColumnName("vegetable");
            e.Property(x => x.Audience).HasColumnName("audience");
            e.Property(x => x.IncludeGuests).HasColumnName("include_guests");
            e.Property(x => x.StartsAt).HasColumnName("starts_at");
            e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            e.Property(x => x.RepeatDays).HasColumnName("repeat_days");
            e.Property(x => x.CancelledAt).HasColumnName("cancelled_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");

            e.HasMany(x => x.Targets).WithOne().HasForeignKey(x => x.NotificationId);
        });

        b.Entity<NotificationTarget>(e =>
        {
            e.ToTable("notification_target");
            e.HasKey(x => new { x.NotificationId, x.UserId });
            e.Property(x => x.NotificationId).HasColumnName("notification_id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Mode).HasColumnName("mode");
        });

        b.Entity<NotificationReceipt>(e =>
        {
            e.ToTable("notification_receipt");
            e.HasKey(x => new { x.NotificationId, x.UserId, x.Round });
            e.Property(x => x.NotificationId).HasColumnName("notification_id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Round).HasColumnName("round");
            e.Property(x => x.ShownAt).HasColumnName("shown_at");
            e.Property(x => x.OpenedAt).HasColumnName("opened_at");
            e.Property(x => x.ClickedAt).HasColumnName("clicked_at");
            e.Property(x => x.DismissedAt).HasColumnName("dismissed_at");
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