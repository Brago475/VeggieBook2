namespace VeggieBook.Api.Books.Print;

// The fixed words printed in book PDFs, in English and Spanish (tú).

internal sealed class BookWords
{
    public required string Prep { get; init; }
    public required string Cook { get; init; }
    public required string Serves { get; init; }
    public required string Ingredients { get; init; }
    public required string Directions { get; init; }
    public required string GoodToKnow { get; init; }
    public required string MadeAhead { get; init; }
    public required string Frozen { get; init; }
    public required string Leftovers { get; init; }
    public required string TipsFor { get; init; }
    public required string WhyItWorks { get; init; }
    public required string LearnMore { get; init; }
    public required string InThisBook { get; init; }
    public required string Continued { get; init; }
    public required string Page { get; init; }
    public required string Of { get; init; }
    public required string RecipeOne { get; init; }
    public required string RecipeMany { get; init; }
    public required string SecretOne { get; init; }
    public required string SecretMany { get; init; }
    public required string[] Months { get; init; }
    public bool Spanish { get; init; }

    public static readonly BookWords En = new()
    {
        Prep = "PREP",
        Cook = "COOK",
        Serves = "SERVES",
        Ingredients = "Ingredients",
        Directions = "Directions",
        GoodToKnow = "Good to know",
        MadeAhead = "Can be made ahead",
        Frozen = "Can be frozen",
        Leftovers = "Good for leftovers",
        TipsFor = "Tips for {0}",
        WhyItWorks = "Why it works",
        LearnMore = "Learn more",
        InThisBook = "In this book",
        Continued = "{0} (continued)",
        Page = "Page",
        Of = "of",
        RecipeOne = "1 recipe",
        RecipeMany = "{0} recipes",
        SecretOne = "1 secret",
        SecretMany = "{0} secrets",
        Months =
        [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
    };

    public static readonly BookWords Es = new()
    {
        Spanish = true,
        Prep = "PREPARACIÓN",
        Cook = "COCCIÓN",
        Serves = "PORCIONES",
        Ingredients = "Ingredientes",
        Directions = "Instrucciones",
        GoodToKnow = "Para saber",
        MadeAhead = "Se puede preparar con anticipación",
        Frozen = "Se puede congelar",
        Leftovers = "Bueno para las sobras",
        TipsFor = "Consejos para {0}",
        WhyItWorks = "Por qué funciona",
        LearnMore = "Más información",
        InThisBook = "En este libro",
        Continued = "{0} (continuación)",
        Page = "Página",
        Of = "de",
        RecipeOne = "1 receta",
        RecipeMany = "{0} recetas",
        SecretOne = "1 secreto",
        SecretMany = "{0} secretos",
        Months =
        [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        ]
    };

    public static BookWords For(bool spanish) => spanish ? Es : En;

    public string Count(int n, bool secrets) =>
        n == 1
            ? (secrets ? SecretOne : RecipeOne)
            : string.Format(secrets ? SecretMany : RecipeMany, n);

    // "made October 14, 2026" or "creado el 14 de octubre de 2026", Eastern.
    public string MadeOn(DateTime utc)
    {
        var d = BookPdf.Local(utc);
        var month = Months[d.Month - 1];
        return Spanish
            ? $"creado el {d.Day} de {month} de {d.Year}"
            : $"made {month} {d.Day}, {d.Year}";
    }

    // MadeOn starting with a capital letter, for a label on its own.
    public string MadeOnLabel(DateTime utc)
    {
        var text = MadeOn(utc);
        return char.ToUpperInvariant(text[0]) + text[1..];
    }
}