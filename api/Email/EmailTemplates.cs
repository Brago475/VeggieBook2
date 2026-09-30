using System.Net;

namespace VeggieBook.Api.Email;

// The words in each email. English only for now; the Spanish version comes
// with the language toggle.
public static class EmailTemplates
{
    public static EmailMessage ConfirmEmail(string to, string link) => Build(
        to,
        "Confirm your VeggieBook account",
        "Thanks for signing up for VeggieBook. Please confirm your email address to finish creating your account.",
        "Confirm my email",
        link,
        "This link expires in 3 hours. If you did not sign up for VeggieBook, you can ignore this email.");

    public static EmailMessage ResetPassword(string to, string link) => Build(
        to,
        "Reset your VeggieBook password",
        "We got a request to reset the password for your VeggieBook account.",
        "Choose a new password",
        link,
        "This link expires in 3 hours. If you did not ask to reset your password, you can ignore this email and your password will stay the same.");

    // Sent when someone tries to sign up with an email that already has an
    // account. The page itself says the same thing as a normal sign-up.
    public static EmailMessage AlreadyRegistered(string to, string homeLink, string forgotLink) => Build(
        to,
        "You already have a VeggieBook account",
        "Someone tried to create a VeggieBook account with this email address, but you already have one. You can sign in, or reset your password if you forgot it.",
        "Reset my password",
        forgotLink,
        $"If this was not you, you can ignore this email. Your account is safe. VeggieBook: {homeLink}");

    private static EmailMessage Build(
        string to, string subject, string intro, string button, string link, string footer)
    {
        var text = $"{intro}\n\n{button}: {link}\n\n{footer}\n";

        var html = $"""
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2d1f">
              <h2 style="color:#2f5d2f">VeggieBook</h2>
              <p>{Html(intro)}</p>
              <p style="margin:28px 0">
                <a href="{Html(link)}" style="background:#2f5d2f;color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;display:inline-block">{Html(button)}</a>
              </p>
              <p style="font-size:13px;color:#5b6b5b">{Html(footer)}</p>
            </div>
            """;

        return new EmailMessage(to, subject, text, html);
    }

    // Escapes text for safe use inside the HTML email.
    private static string Html(string value) => WebUtility.HtmlEncode(value);
}