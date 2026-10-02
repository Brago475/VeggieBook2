using System.Net.Mail;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Small checks shared by the account controllers.
public static class AuthHelpers
{
    // Guest accounts get an address here. ".invalid" is reserved and can
    // never receive mail, and IsValidEmail refuses it, so nobody can sign up,
    // sign in, or recover an account with one.
    public const string GuestEmailDomain = "guest.invalid";

    public static readonly string PasswordRule =
        $"Password must be at least {AuthSetup.MinPasswordLength} characters and include " +
        "an uppercase letter, a lowercase letter, and a special character.";

    // MailAddress also accepts forms like "Name <a@b.com>". Requiring the
    // parsed address to equal the input rules those out.
    public static bool IsValidEmail(string email) =>
        email.Length is > 0 and <= 254
        && MailAddress.TryCreate(email, out var parsed)
        && parsed.Address == email
        && !email.EndsWith("@" + GuestEmailDomain, StringComparison.OrdinalIgnoreCase);

    // The full password rule, checked before any hashing. The maximum length
    // stops anyone from making the server hash megabytes. Identity checks the
    // same rule again (see AuthSetup), so nothing gets past both.
    //
    // The name is from when only the length was checked. It stays so the
    // code that already calls it keeps working.
    public static string? CheckPasswordLength(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < AuthSetup.MinPasswordLength)
            return PasswordRule;
        if (password.Length > AuthSetup.MaxPasswordLength)
            return $"Password must be at most {AuthSetup.MaxPasswordLength} characters.";
        if (!password.Any(char.IsUpper)
            || !password.Any(char.IsLower)
            || password.All(char.IsLetterOrDigit))
            return PasswordRule;
        return null;
    }

    // Identity's tokens contain characters that break in a URL or JSON, so
    // they travel Base64Url encoded.
    public static string EncodeToken(string token) =>
        WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

    public static string? DecodeToken(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded)) return null;
        try
        {
            return Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(encoded));
        }
        catch (FormatException)
        {
            return null;
        }
    }

    public static string FirstError(IdentityResult result) =>
        result.Errors.FirstOrDefault()?.Description
        ?? "Something went wrong. Please try again.";

    // A guest's placeholder address is never shown, so guests get a null
    // email and the site tells them apart by the Guest role.
    public static async Task<MeResponse> MeFor(UserManager<AppUser> users, AppUser user)
    {
        var roles = (await users.GetRolesAsync(user)).ToArray();
        var isGuest = roles.Contains(Roles.Guest);
        return new MeResponse(
            isGuest ? null : user.Email,
            roles,
            isGuest ? null : user.DisplayName);
    }
}