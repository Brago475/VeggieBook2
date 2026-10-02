using System.Security.Cryptography;

namespace VeggieBook.Api.Auth;

// The rules for the Create Account form, apart from the password (see
// AuthHelpers) and the PIN and question (see AccountRecovery).
public static class SignUpRules
{
    // The Terms of Use version a new account agrees to. Keep this equal to
    // the version in web/src/content/terms.tsx.
    public const string TermsVersion = "1.1";

    public const int MaxNameLength = 50;
    public const int MinDisplayNameLength = 3;
    public const int MaxDisplayNameLength = 20;

    // Everyone must be 18 or older, so there is no range under 18.
    public static readonly string[] AgeRanges =
        ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

    public static string? CheckName(string? value, string label)
    {
        var name = value?.Trim() ?? "";
        if (name.Length == 0)
            return $"Please enter your {label}.";
        if (name.Length > MaxNameLength)
            return $"Your {label} must be at most {MaxNameLength} characters.";
        if (!name.All(c => char.IsLetter(c) || c is ' ' or '-' or '\'' or '.'))
            return $"Your {label} can only use letters, spaces, hyphens, and apostrophes.";
        return null;
    }

    public static string? CheckDisplayName(string name)
    {
        if (name.Length < MinDisplayNameLength || name.Length > MaxDisplayNameLength)
            return $"Your username must be {MinDisplayNameLength} to {MaxDisplayNameLength} characters.";
        if (!name.All(c => char.IsAsciiLetterOrDigit(c) || c == '_'))
            return "Your username can only use letters, numbers, and underscores.";
        return null;
    }

    public static string? CheckAgeRange(string? range) =>
        range is not null && AgeRanges.Contains(range)
            ? null
            : "Please choose your age range. You must be 18 or older to create an account.";

    // A username for someone who left it blank, such as cook_48213.
    // The caller checks it is free before using it.
    public static string GenerateDisplayName() =>
        $"cook_{RandomNumberGenerator.GetInt32(10000, 1000000)}";
}