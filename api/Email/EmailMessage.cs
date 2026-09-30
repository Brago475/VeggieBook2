namespace VeggieBook.Api.Email;

// One email, ready to send. Text is the plain version for mail apps that
// do not show HTML.
public record EmailMessage(string To, string Subject, string Text, string Html);