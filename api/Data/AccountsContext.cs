using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.Data;

// Database context for user data: accounts now, saved books next.
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
    }
}