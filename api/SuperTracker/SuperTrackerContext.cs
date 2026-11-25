using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.SuperTracker;

// Database context for SuperTracker2 data only, kept apart from
// AccountsContext. Same rules: no EF migrations, snake_case names, and
// db/migrations is the source of truth.

public class SuperTrackerContext(DbContextOptions<SuperTrackerContext> options) : DbContext(options)
{
    public DbSet<St2Profile> Profiles => Set<St2Profile>();
    public DbSet<St2TermsAcceptance> TermsAcceptances => Set<St2TermsAcceptance>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<St2Profile>(e =>
        {
            e.ToTable("st2_profile");
            e.HasKey(x => x.UserId);
            e.Property(x => x.UserId).HasColumnName("user_id").ValueGeneratedNever();
            e.Property(x => x.Age).HasColumnName("age");
            e.Property(x => x.Sex).HasColumnName("sex");
            e.Property(x => x.HeightCm).HasColumnName("height_cm");
            e.Property(x => x.WeightKg).HasColumnName("weight_kg");
            e.Property(x => x.Activity).HasColumnName("activity");
            e.Property(x => x.Units).HasColumnName("units");
            e.Property(x => x.CalorieGoal).HasColumnName("calorie_goal");   // 033
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });

        b.Entity<St2TermsAcceptance>(e =>
        {
            e.ToTable("st2_terms_acceptance");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Version).HasColumnName("version");
            e.Property(x => x.AcceptedAt).HasColumnName("accepted_at");
        });
    }
}