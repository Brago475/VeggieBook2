using System.Net.Http.Json;

namespace VeggieBook.Api.Email;

// Sends email through Resend's API (https://resend.com/docs/api-reference).
// The HttpClient comes preconfigured from EmailSetup with the API key.
public class ResendMailer(HttpClient http, EmailSettings settings, ILogger<ResendMailer> log)
    : IMailer
{
    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        var payload = new
        {
            from = settings.From,
            to = new[] { message.To },
            subject = message.Subject,
            text = message.Text,
            html = message.Html
        };

        using var response = await http.PostAsJsonAsync("emails", payload, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            log.LogError("Resend refused an email: {Status} {Body}",
                (int)response.StatusCode, body);
        }
    }
}