namespace VeggieBook.Api.Email;

// Used when Email__ResendApiKey is not set. Prints each email, links
// included, to the API log so they can be clicked while testing.
//
// Never leave this on for real users: anyone who can read the server's logs
// could use the reset links.
public class LogMailer(ILogger<LogMailer> log) : IMailer
{
    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        log.LogWarning(
            "Email is not configured, printing instead.\nTo: {To}\nSubject: {Subject}\n\n{Text}",
            message.To, message.Subject, message.Text);
        return Task.CompletedTask;
    }
}