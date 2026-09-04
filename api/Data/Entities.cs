namespace VeggieBook.Api.Data;

// Entities mapped onto the tables created by db/schema.sql.
//
// The database exists first and these conform to it. That is the reverse of
// the usual EF flow, and it is deliberate: the schema was designed against the
// original app's structure and loaded with 258 recipes before any C# existed.
// EF migrations are NOT used. Schema changes go in db/schema.sql and these
// classes follow.
//
// Bilingual fields are *_en / *_es pairs rather than a translation join,
// matching the schema. Controllers pick the right one per request language.

public class Vegetable
{
    public string Code { get; set; } = "";        // BROCCOLI
    public string ShortCode { get; set; } = "";   // BR
    public string NameEn { get; set; } = "";
    public string NameEs { get; set; } = "";
    public string? ImagePath { get; set; }
    public bool Active { get; set; }
    public int SortOrder { get; set; }

    public List<Recipe> Recipes { get; set; } = [];
    public List<Tip> Tips { get; set; } = [];
}

public class Attribute
{
    public string Name { get; set; } = "";        // HasMicrowave, AgreeSoup
}

public class Question
{
    public int Id { get; set; }
    public string Mnemonic { get; set; } = "";    // PREPEQUIP, NUTRITION
    public string Phase { get; set; } = "";
    public char QType { get; set; }               // Z multi-select, H hidden
    public int OrderPriority { get; set; }

    // Intro text contains a %s placeholder for the vegetable name.
    public string? IntroEn { get; set; }
    public string? IntroEs { get; set; }
    public string? SubIntroEn { get; set; }
    public string? SubIntroEs { get; set; }
    public bool IsHidden { get; set; }

    public List<QuestionChoice> Choices { get; set; } = [];
}

public class QuestionChoice
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string Attribute { get; set; } = "";
    public string TextEn { get; set; } = "";
    public string TextEs { get; set; } = "";
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }

    public Question? Question { get; set; }
}

public class Recipe
{
    public int Id { get; set; }
    public string? Rid { get; set; }            // 10202, internal number
    public string? DisplayCode { get; set; }    // BR-202, names the image folder
    public string VegetableCode { get; set; } = "";
    public bool Active { get; set; }

    public string TitleEn { get; set; } = "";
    public string TitleEs { get; set; } = "";
    public string? StoryLineEn { get; set; }
    public string? StoryLineEs { get; set; }
    public string TimeToPrepareEn { get; set; } = "";
    public string TimeToPrepareEs { get; set; } = "";
    public string TimeToCookEn { get; set; } = "";
    public string TimeToCookEs { get; set; } = "";
    public string ServingsEn { get; set; } = "";
    public string ServingsEs { get; set; } = "";
    public string CanBeMadeAheadEn { get; set; } = "";
    public string CanBeMadeAheadEs { get; set; } = "";
    public string CanBeFrozenEn { get; set; } = "";
    public string CanBeFrozenEs { get; set; } = "";
    public string GoodForLeftoversEn { get; set; } = "";
    public string GoodForLeftoversEs { get; set; } = "";

    public Vegetable? Vegetable { get; set; }
    public List<RecipeIngredient> Ingredients { get; set; } = [];
    public List<RecipeStep> Steps { get; set; } = [];
    public List<RecipePhoto> Photos { get; set; } = [];
    public List<RecipeNote> Notes { get; set; } = [];
    public List<RecipeAttribute> Attributes { get; set; } = [];
    public List<Annotation> Annotations { get; set; } = [];
}

public class RecipeIngredient
{
    public long Id { get; set; }
    public int RecipeId { get; set; }
    public int Position { get; set; }
    public string TextEn { get; set; } = "";
    public string TextEs { get; set; } = "";
}

public class RecipeStep
{
    public long Id { get; set; }
    public int RecipeId { get; set; }
    public int Position { get; set; }
    public string TextEn { get; set; } = "";
    public string TextEs { get; set; } = "";
}

public class RecipePhoto
{
    public long Id { get; set; }
    public int RecipeId { get; set; }
    public int Position { get; set; }
    public string ImagePath { get; set; } = "";
}

public class RecipeNote
{
    public long Id { get; set; }
    public int RecipeId { get; set; }
    public int? Position { get; set; }
    public string TextEn { get; set; } = "";
    public string TextEs { get; set; } = "";
}

// A recipe shows only when the user selected EVERY attribute listed here.
public class RecipeAttribute
{
    public int RecipeId { get; set; }
    public string Attribute { get; set; } = "";
}

// The colored badges on a recipe card: Kid Friendly, Latino Flavors,
// Soul Food, Asian Flavors. Each shows only if the user selected its
// attribute. Image paths are null because the source data's image
// references are wrong (they resolve to recipe photographs).
public class Annotation
{
    public int Id { get; set; }
    public string DisplayedIf { get; set; } = "";
    public string TextEn { get; set; } = "";
    public string TextEs { get; set; } = "";
    public string? ImagePathEn { get; set; }
    public string? ImagePathEs { get; set; }
    public string Color { get; set; } = "";      // hex, no leading #

    public List<Recipe> Recipes { get; set; } = [];
}

public class Tip
{
    public int Id { get; set; }
    public string VegetableCode { get; set; } = "";
    public string Attribute { get; set; } = "";
    public string HeadingEn { get; set; } = "";
    public string HeadingEs { get; set; } = "";
    public int SortOrder { get; set; }

    public Vegetable? Vegetable { get; set; }
    public List<TipBlock> Blocks { get; set; } = [];
}

public class TipBlock
{
    public int Id { get; set; }
    public int TipId { get; set; }
    public int? Position { get; set; }
    public string TextEn { get; set; } = "";
    public string TextEs { get; set; } = "";
    public string? ImagePath { get; set; }
}

public class SecretCategory
{
    public int Id { get; set; }
    public string NameEn { get; set; } = "";
    public string NameEs { get; set; } = "";
    public string? ImagePath { get; set; }
    public string Color { get; set; } = "";
    public int SortOrder { get; set; }

    public List<Secret> Secrets { get; set; } = [];
}

// Images and attachments are per-language because the Secrets illustrations
// have text drawn into the artwork.
public class Secret
{
    public int Id { get; set; }
    public int DisplayNumber { get; set; }
    public int CategoryId { get; set; }
    public bool Active { get; set; }

    public string HeadlineEn { get; set; } = "";
    public string HeadlineEs { get; set; } = "";
    public string WhyItWorksEn { get; set; } = "";
    public string WhyItWorksEs { get; set; } = "";

    public string? ImagePathEn { get; set; }
    public string? ImagePathEs { get; set; }
    public string? CoverImageEn { get; set; }
    public string? CoverImageEs { get; set; }
    public string? AttachmentEn { get; set; }
    public string? AttachmentEs { get; set; }

    public SecretCategory? Category { get; set; }
    public List<SecretLink> Links { get; set; } = [];
}

public class SecretLink
{
    public long Id { get; set; }
    public int SecretId { get; set; }
    public string Language { get; set; } = "";   // en or es
    public string Url { get; set; } = "";
    public string? LabelEn { get; set; }
    public string? LabelEs { get; set; }
}
