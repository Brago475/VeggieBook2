namespace VeggieBook.Api.Email;

// Sends one email. ResendMailer sends for real; LogMailer prints to the API
// log for testing. EmailSetup picks one based on configuration.
public interface IMailer
{
    Task SendAsync(EmailMessage message, CancellationToken ct);
}