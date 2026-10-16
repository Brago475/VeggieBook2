using System.Security.Cryptography;

namespace VeggieBook.Api.Auth;

// Create Account rules, apart from the password (AuthHelpers) and the PIN and
// question (AccountRecovery). Each problem returns an ApiError with a code and English text.
public static class SignUpRules
{
    // Must match the version in web/src/content/terms.tsx.
    public const string TermsVersion = "1.2";

    public const int MaxNameLength = 50;
    public const int MinDisplayNameLength = 3;
    public const int MaxDisplayNameLength = 20;

    // Accounts are 18 and older only.
    public static readonly string[] AgeRanges =
        ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

    public static ApiError? CheckName(string? value, string label)
    {
        var name = value?.Trim() ?? "";
        if (name.Length == 0)
            return new(ErrorCodes.Name(label, "empty"), $"Please enter your {label}.");
        if (name.Length > MaxNameLength)
            return new(ErrorCodes.Name(label, "too_long"),
                $"Your {label} must be at most {MaxNameLength} characters.")
            { Values = new { max = MaxNameLength } };
        if (!name.All(c => char.IsLetter(c) || c is ' ' or '-' or '\'' or '.'))
            return new(ErrorCodes.Name(label, "chars"),
                $"Your {label} can only use letters, spaces, hyphens, and apostrophes.");
        return null;
    }

    public static ApiError? CheckDisplayName(string name)
    {
        if (name.Length < MinDisplayNameLength || name.Length > MaxDisplayNameLength)
            return new(ErrorCodes.UsernameLength,
                $"Your username must be {MinDisplayNameLength} to {MaxDisplayNameLength} characters.")
            { Values = new { min = MinDisplayNameLength, max = MaxDisplayNameLength } };
        if (!name.All(c => char.IsAsciiLetterOrDigit(c) || c == '_'))
            return new(ErrorCodes.UsernameChars,
                "Your username can only use letters, numbers, and underscores.");
        return null;
    }

    public static ApiError? CheckAgeRange(string? range) =>
        range is not null && AgeRanges.Contains(range)
            ? null
            : new(ErrorCodes.AgeRangeRequired,
                "Please choose your age range. You must be 18 or older to create an account.");

    // Fallback username such as cook_48213. The caller checks it is free.
    public static string GenerateDisplayName() =>
        $"cook_{RandomNumberGenerator.GetInt32(10000, 1000000)}";
}