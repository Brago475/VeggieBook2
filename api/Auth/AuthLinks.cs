namespace VeggieBook.Api.Auth;

// Builds the links that go out in emails. The site's address comes from
// App__PublicUrl, so links always point at the real site and never at
// whatever host a request claimed to come from.
public class AuthLinks(string publicUrl)
{
    private readonly string baseUrl = publicUrl.TrimEnd('/');

    public string Home => baseUrl + "/";

    public string ForgotPassword => baseUrl + "/forgot-password";

    public string ConfirmEmail(Guid userId, string token) =>
        $"{baseUrl}/confirm-email?user={userId}&token={AuthHelpers.EncodeToken(token)}";

    public string ResetPassword(Guid userId, string token) =>
        $"{baseUrl}/reset-password?user={userId}&token={AuthHelpers.EncodeToken(token)}";
}