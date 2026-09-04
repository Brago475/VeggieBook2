using Microsoft.EntityFrameworkCore;

namespace VeggieBook.Api.Data;

// Maps the entity classes onto the tables in db/schema.sql.
//
// EF's default naming would give PascalCase tables and columns; the schema is
// snake_case. Every mapping is explicit rather than relying on a naming
// convention package, so what the query generator produces is visible in this
// file and nowhere else.
//
// There are no migrations. db/schema.sql is the source of truth for the
// database, and this context conforms to it.

public class VeggieBookContext(DbContextOptions<VeggieBookContext> options)
    : DbContext(options)
{
    public DbSet<Vegetable> Vegetables => Set<Vegetable>();
    public DbSet<Attribute> Attributes => Set<Attribute>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionChoice> QuestionChoices => Set<QuestionChoice>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<RecipeStep> RecipeSteps => Set<RecipeStep>();
    public DbSet<RecipePhoto> RecipePhotos => Set<RecipePhoto>();
    public DbSet<RecipeNote> RecipeNotes => Set<RecipeNote>();
    public DbSet<RecipeAttribute> RecipeAttributes => Set<RecipeAttribute>();
    public DbSet<Annotation> Annotations => Set<Annotation>();
    public DbSet<Tip> Tips => Set<Tip>();
    public DbSet<TipBlock> TipBlocks => Set<TipBlock>();
    public DbSet<SecretCategory> SecretCategories => Set<SecretCategory>();
    public DbSet<Secret> Secrets => Set<Secret>();
    public DbSet<SecretLink> SecretLinks => Set<SecretLink>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Vegetable>(e =>
        {
            e.ToTable("vegetable");
            e.HasKey(x => x.Code);
            e.Property(x => x.Code).HasColumnName("code");
            e.Property(x => x.ShortCode).HasColumnName("short_code");
            e.Property(x => x.NameEn).HasColumnName("name_en");
            e.Property(x => x.NameEs).HasColumnName("name_es");
            e.Property(x => x.ImagePath).HasColumnName("image_path");
            e.Property(x => x.Active).HasColumnName("active");
            e.Property(x => x.SortOrder).HasColumnName("sort_order");
        });

        b.Entity<Attribute>(e =>
        {
            e.ToTable("attribute");
            e.HasKey(x => x.Name);
            e.Property(x => x.Name).HasColumnName("name");
        });

        b.Entity<Question>(e =>
        {
            e.ToTable("question");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.Mnemonic).HasColumnName("mnemonic");
            e.Property(x => x.Phase).HasColumnName("phase");
            e.Property(x => x.QType).HasColumnName("qtype");
            e.Property(x => x.OrderPriority).HasColumnName("order_priority");
            e.Property(x => x.IntroEn).HasColumnName("intro_en");
            e.Property(x => x.IntroEs).HasColumnName("intro_es");
            e.Property(x => x.SubIntroEn).HasColumnName("sub_intro_en");
            e.Property(x => x.SubIntroEs).HasColumnName("sub_intro_es");
            e.Property(x => x.IsHidden).HasColumnName("is_hidden");
            e.HasMany(x => x.Choices)
             .WithOne(x => x.Question)
             .HasForeignKey(x => x.QuestionId);
        });

        b.Entity<QuestionChoice>(e =>
        {
            e.ToTable("question_choice");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.QuestionId).HasColumnName("question_id");
            e.Property(x => x.Attribute).HasColumnName("attribute");
            e.Property(x => x.TextEn).HasColumnName("text_en");
            e.Property(x => x.TextEs).HasColumnName("text_es");
            e.Property(x => x.IsDefault).HasColumnName("is_default");
            e.Property(x => x.SortOrder).HasColumnName("sort_order");
        });

        b.Entity<Recipe>(e =>
        {
            e.ToTable("recipe");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.Rid).HasColumnName("rid");
            e.Property(x => x.DisplayCode).HasColumnName("display_code");
            e.Property(x => x.VegetableCode).HasColumnName("vegetable_code");
            e.Property(x => x.Active).HasColumnName("active");
            e.Property(x => x.TitleEn).HasColumnName("title_en");
            e.Property(x => x.TitleEs).HasColumnName("title_es");
            e.Property(x => x.StoryLineEn).HasColumnName("story_line_en");
            e.Property(x => x.StoryLineEs).HasColumnName("story_line_es");
            e.Property(x => x.TimeToPrepareEn).HasColumnName("time_to_prepare_en");
            e.Property(x => x.TimeToPrepareEs).HasColumnName("time_to_prepare_es");
            e.Property(x => x.TimeToCookEn).HasColumnName("time_to_cook_en");
            e.Property(x => x.TimeToCookEs).HasColumnName("time_to_cook_es");
            e.Property(x => x.ServingsEn).HasColumnName("servings_en");
            e.Property(x => x.ServingsEs).HasColumnName("servings_es");
            e.Property(x => x.CanBeMadeAheadEn).HasColumnName("can_be_made_ahead_en");
            e.Property(x => x.CanBeMadeAheadEs).HasColumnName("can_be_made_ahead_es");
            e.Property(x => x.CanBeFrozenEn).HasColumnName("can_be_frozen_en");
            e.Property(x => x.CanBeFrozenEs).HasColumnName("can_be_frozen_es");
            e.Property(x => x.GoodForLeftoversEn).HasColumnName("good_for_leftovers_en");
            e.Property(x => x.GoodForLeftoversEs).HasColumnName("good_for_leftovers_es");

            e.HasOne(x => x.Vegetable)
             .WithMany(x => x.Recipes)
             .HasForeignKey(x => x.VegetableCode);

            e.HasMany(x => x.Ingredients).WithOne().HasForeignKey(x => x.RecipeId);
            e.HasMany(x => x.Steps).WithOne().HasForeignKey(x => x.RecipeId);
            e.HasMany(x => x.Photos).WithOne().HasForeignKey(x => x.RecipeId);
            e.HasMany(x => x.Notes).WithOne().HasForeignKey(x => x.RecipeId);
            e.HasMany(x => x.Attributes).WithOne().HasForeignKey(x => x.RecipeId);

            // The join table has no CLR class, so the shadow properties must
            // be declared with explicit types and column names. Letting EF
            // infer them fails: it cannot guess the type of a property that
            // exists nowhere in code.
            e.HasMany(x => x.Annotations)
             .WithMany(x => x.Recipes)
             .UsingEntity(
                 "recipe_annotation",
                 r => r.HasOne(typeof(Annotation))
                       .WithMany()
                       .HasForeignKey("annotation_id")
                       .HasPrincipalKey(nameof(Annotation.Id)),
                 l => l.HasOne(typeof(Recipe))
                       .WithMany()
                       .HasForeignKey("recipe_id")
                       .HasPrincipalKey(nameof(Recipe.Id)),
                 j => j.HasKey("recipe_id", "annotation_id"));
        });

        b.Entity<RecipeIngredient>(e =>
        {
            e.ToTable("recipe_ingredient");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RecipeId).HasColumnName("recipe_id");
            e.Property(x => x.Position).HasColumnName("position");
            e.Property(x => x.TextEn).HasColumnName("text_en");
            e.Property(x => x.TextEs).HasColumnName("text_es");
        });

        b.Entity<RecipeStep>(e =>
        {
            e.ToTable("recipe_step");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RecipeId).HasColumnName("recipe_id");
            e.Property(x => x.Position).HasColumnName("position");
            e.Property(x => x.TextEn).HasColumnName("text_en");
            e.Property(x => x.TextEs).HasColumnName("text_es");
        });

        b.Entity<RecipePhoto>(e =>
        {
            e.ToTable("recipe_photo");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RecipeId).HasColumnName("recipe_id");
            e.Property(x => x.Position).HasColumnName("position");
            e.Property(x => x.ImagePath).HasColumnName("image_path");
        });

        b.Entity<RecipeNote>(e =>
        {
            e.ToTable("recipe_note");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RecipeId).HasColumnName("recipe_id");
            e.Property(x => x.Position).HasColumnName("position");
            e.Property(x => x.TextEn).HasColumnName("text_en");
            e.Property(x => x.TextEs).HasColumnName("text_es");
        });

        b.Entity<RecipeAttribute>(e =>
        {
            e.ToTable("recipe_attribute");
            e.HasKey(x => new { x.RecipeId, x.Attribute });
            e.Property(x => x.RecipeId).HasColumnName("recipe_id");
            e.Property(x => x.Attribute).HasColumnName("attribute");
        });

        b.Entity<Annotation>(e =>
        {
            e.ToTable("annotation");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.DisplayedIf).HasColumnName("displayed_if");
            e.Property(x => x.TextEn).HasColumnName("text_en");
            e.Property(x => x.TextEs).HasColumnName("text_es");
            e.Property(x => x.ImagePathEn).HasColumnName("image_path_en");
            e.Property(x => x.ImagePathEs).HasColumnName("image_path_es");
            e.Property(x => x.Color).HasColumnName("color");
        });

        b.Entity<Tip>(e =>
        {
            e.ToTable("tip");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.VegetableCode).HasColumnName("vegetable_code");
            e.Property(x => x.Attribute).HasColumnName("attribute");
            e.Property(x => x.HeadingEn).HasColumnName("heading_en");
            e.Property(x => x.HeadingEs).HasColumnName("heading_es");
            e.Property(x => x.SortOrder).HasColumnName("sort_order");

            e.HasOne(x => x.Vegetable)
             .WithMany(x => x.Tips)
             .HasForeignKey(x => x.VegetableCode);

            e.HasMany(x => x.Blocks).WithOne().HasForeignKey(x => x.TipId);
        });

        b.Entity<TipBlock>(e =>
        {
            e.ToTable("tip_block");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.TipId).HasColumnName("tip_id");
            e.Property(x => x.Position).HasColumnName("position");
            e.Property(x => x.TextEn).HasColumnName("text_en");
            e.Property(x => x.TextEs).HasColumnName("text_es");
            e.Property(x => x.ImagePath).HasColumnName("image_path");
        });

        b.Entity<SecretCategory>(e =>
        {
            e.ToTable("secret_category");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.NameEn).HasColumnName("name_en");
            e.Property(x => x.NameEs).HasColumnName("name_es");
            e.Property(x => x.ImagePath).HasColumnName("image_path");
            e.Property(x => x.Color).HasColumnName("color");
            e.Property(x => x.SortOrder).HasColumnName("sort_order");
            e.HasMany(x => x.Secrets)
             .WithOne(x => x.Category)
             .HasForeignKey(x => x.CategoryId);
        });

        b.Entity<Secret>(e =>
        {
            e.ToTable("secret");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(x => x.DisplayNumber).HasColumnName("display_number");
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            e.Property(x => x.Active).HasColumnName("active");
            e.Property(x => x.HeadlineEn).HasColumnName("headline_en");
            e.Property(x => x.HeadlineEs).HasColumnName("headline_es");
            e.Property(x => x.WhyItWorksEn).HasColumnName("why_it_works_en");
            e.Property(x => x.WhyItWorksEs).HasColumnName("why_it_works_es");
            e.Property(x => x.ImagePathEn).HasColumnName("image_path_en");
            e.Property(x => x.ImagePathEs).HasColumnName("image_path_es");
            e.Property(x => x.CoverImageEn).HasColumnName("cover_image_en");
            e.Property(x => x.CoverImageEs).HasColumnName("cover_image_es");
            e.Property(x => x.AttachmentEn).HasColumnName("attachment_en");
            e.Property(x => x.AttachmentEs).HasColumnName("attachment_es");
            e.HasMany(x => x.Links).WithOne().HasForeignKey(x => x.SecretId);
        });

        b.Entity<SecretLink>(e =>
        {
            e.ToTable("secret_link");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.SecretId).HasColumnName("secret_id");
            e.Property(x => x.Language).HasColumnName("language");
            e.Property(x => x.Url).HasColumnName("url");
            e.Property(x => x.LabelEn).HasColumnName("label_en");
            e.Property(x => x.LabelEs).HasColumnName("label_es");
        });
    }
}
