namespace VeggieBook.Api.Email;

// Sends queued emails one at a time. A failed send is logged and skipped,
// never retried forever, and never takes the API down.
public class EmailWorker(
    EmailQueue queue,
    IServiceScopeFactory scopes,
    ILogger<EmailWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = scopes.CreateScope();
                var mailer = scope.ServiceProvider.GetRequiredService<IMailer>();
                await mailer.SendAsync(message, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                log.LogError(ex, "Could not send an email: {Subject}", message.Subject);
            }
        }
    }
}