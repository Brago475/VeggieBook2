using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.SuperTracker;

// Database context for SuperTracker2 data only, kept apart from
// AccountsContext. Same rules: no EF migrations, snake_case names, and
// db/migrations is the source of truth. Hidden food entries (deleted_at
// set) are filtered out of every query.

public class SuperTrackerContext(DbContextOptions<SuperTrackerContext> options) : DbContext(options)
{
    public DbSet<St2Profile> Profiles => Set<St2Profile>();
    public DbSet<St2TermsAcceptance> TermsAcceptances => Set<St2TermsAcceptance>();
    public DbSet<St2Food> Foods => Set<St2Food>();
    public DbSet<St2FoodName> FoodNames => Set<St2FoodName>();
    public DbSet<St2FoodPortion> FoodPortions => Set<St2FoodPortion>();
    public DbSet<St2FoodValue> FoodValues => Set<St2FoodValue>();
    public DbSet<St2Vegetable> Vegetables => Set<St2Vegetable>();
    public DbSet<St2FoodEntry> FoodEntries => Set<St2FoodEntry>();
    public DbSet<St2FavoriteFood> FavoriteFoods => Set<St2FavoriteFood>();
    public DbSet<St2Combo> Combos => Set<St2Combo>();
    public DbSet<St2ComboItem> ComboItems => Set<St2ComboItem>();
    public DbSet<St2CustomFood> CustomFoods => Set<St2CustomFood>();

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

        // See db/migrations/034_supertracker_foods.sql.
        b.Entity<St2Food>(e =>
        {
            e.ToTable("st2_food");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.FoodCode).HasColumnName("food_code");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.Categories).HasColumnName("categories");
        });

        b.Entity<St2FoodName>(e =>
        {
            e.ToTable("st2_food_name");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.FoodId).HasColumnName("food_id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.Priority).HasColumnName("priority");
        });

        b.Entity<St2FoodPortion>(e =>
        {
            e.ToTable("st2_food_portion");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.FoodId).HasColumnName("food_id");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.Grams).HasColumnName("grams");
            e.Property(x => x.Increment).HasColumnName("increment");
            e.Property(x => x.IsDefault).HasColumnName("is_default");
        });

        b.Entity<St2FoodValue>(e =>
        {
            e.ToTable("st2_food_value");
            e.HasKey(x => x.FoodId);
            e.Property(x => x.FoodId).HasColumnName("food_id").ValueGeneratedNever();
            e.Property(x => x.VegTotal).HasColumnName("veg_total");
            e.Property(x => x.FruitTotal).HasColumnName("fruit_total");
            e.Property(x => x.DairyTotal).HasColumnName("dairy_total");
            e.Property(x => x.GrainWhole).HasColumnName("grain_whole");
            e.Property(x => x.OilsTsp).HasColumnName("oils_tsp");
            e.Property(x => x.AddedSugarG).HasColumnName("added_sugar_g");
            e.Property(x => x.Kcal).HasColumnName("kcal");
            e.Property(x => x.ProteinG).HasColumnName("protein_g");
            e.Property(x => x.SatFatG).HasColumnName("sat_fat_g");
            e.Property(x => x.FiberG).HasColumnName("fiber_g");
            e.Property(x => x.SodiumMg).HasColumnName("sodium_mg");
            e.Property(x => x.PotassiumMg).HasColumnName("potassium_mg");
            e.Property(x => x.VitaminCMg).HasColumnName("vitamin_c_mg");
        });

        // See db/migrations/035 and 036.
        b.Entity<St2Vegetable>(e =>
        {
            e.ToTable("st2_vegetable");
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasColumnName("key");
            e.Property(x => x.VegetableCode).HasColumnName("vegetable_code");
            e.Property(x => x.NameEn).HasColumnName("name_en");
            e.Property(x => x.NameEs).HasColumnName("name_es");
            e.Property(x => x.FoodId).HasColumnName("food_id");
            e.Property(x => x.CupGrams).HasColumnName("cup_grams");
            e.Property(x => x.Position).HasColumnName("position");
            e.Property(x => x.Active).HasColumnName("active");                   // 036
        });

        b.Entity<St2FoodEntry>(e =>
        {
            e.ToTable("st2_food_entry");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.EatenOn).HasColumnName("eaten_on");
            e.Property(x => x.Meal).HasColumnName("meal");
            e.Property(x => x.FoodId).HasColumnName("food_id");
            e.Property(x => x.CustomFoodId).HasColumnName("custom_food_id");    // 039
            e.Property(x => x.VegetableKey).HasColumnName("vegetable_key");
            e.Property(x => x.Portion).HasColumnName("portion");
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.Grams).HasColumnName("grams");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");           // 037

            e.HasQueryFilter(x => x.DeletedAt == null);
        });

        // See db/migrations/037_supertracker_favorites.sql.
        b.Entity<St2FavoriteFood>(e =>
        {
            e.ToTable("st2_favorite_food");
            e.HasKey(x => new { x.UserId, x.FoodId });
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.FoodId).HasColumnName("food_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.RemovedAt).HasColumnName("removed_at");
        });

        // See db/migrations/038 and 039.
        b.Entity<St2Combo>(e =>
        {
            e.ToTable("st2_combo");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.RemovedAt).HasColumnName("removed_at");

            e.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.ComboId);
        });

        b.Entity<St2ComboItem>(e =>
        {
            e.ToTable("st2_combo_item");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.ComboId).HasColumnName("combo_id");
            e.Property(x => x.Position).HasColumnName("position");
            e.Property(x => x.FoodId).HasColumnName("food_id");
            e.Property(x => x.CustomFoodId).HasColumnName("custom_food_id");    // 039
            e.Property(x => x.VegetableKey).HasColumnName("vegetable_key");
            e.Property(x => x.Portion).HasColumnName("portion");
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.Grams).HasColumnName("grams");
        });

        // See db/migrations/039_supertracker_custom_foods.sql.
        b.Entity<St2CustomFood>(e =>
        {
            e.ToTable("st2_custom_food");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.Serving).HasColumnName("serving");
            e.Property(x => x.ServingGrams).HasColumnName("serving_grams");
            e.Property(x => x.Kcal).HasColumnName("kcal");
            e.Property(x => x.ProteinG).HasColumnName("protein_g");
            e.Property(x => x.SatFatG).HasColumnName("sat_fat_g");
            e.Property(x => x.SodiumMg).HasColumnName("sodium_mg");
            e.Property(x => x.AddedSugarG).HasColumnName("added_sugar_g");
            e.Property(x => x.FiberG).HasColumnName("fiber_g");
            e.Property(x => x.Vegetables).HasColumnName("vegetables");
            e.Property(x => x.Fruits).HasColumnName("fruits");
            e.Property(x => x.Dairy).HasColumnName("dairy");
            e.Property(x => x.WholeGrains).HasColumnName("whole_grains");
            e.Property(x => x.HealthyFats).HasColumnName("healthy_fats");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.RemovedAt).HasColumnName("removed_at");
        });
    }
}