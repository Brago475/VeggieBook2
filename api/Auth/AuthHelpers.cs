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
    // sign in, or request a reset with one.
    public const string GuestEmailDomain = "guest.invalid";

    // MailAddress also accepts forms like "Name <a@b.com>". Requiring the
    // parsed address to equal the input rules those out.
    public static bool IsValidEmail(string email) =>
        email.Length is > 0 and <= 254
        && MailAddress.TryCreate(email, out var parsed)
        && parsed.Address == email
        && !email.EndsWith("@" + GuestEmailDomain, StringComparison.OrdinalIgnoreCase);

    // Identity enforces the minimum length. The maximum is checked here,
    // before any hashing, so nobody can make the server hash megabytes.
    public static string? CheckPasswordLength(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < AuthSetup.MinPasswordLength)
            return $"Password must be at least {AuthSetup.MinPasswordLength} characters.";
        if (password.Length > AuthSetup.MaxPasswordLength)
            return $"Password must be at most {AuthSetup.MaxPasswordLength} characters.";
        return null;
    }

    // Identity's tokens contain characters that break in a URL, so links
    // carry them Base64Url encoded.
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
        return new MeResponse(roles.Contains(Roles.Guest) ? null : user.Email, roles);
    }
}