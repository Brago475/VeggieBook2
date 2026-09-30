namespace VeggieBook.Api.Auth;

// Deletes guest accounts that are past their 24 hours, with everything in
// them. Runs once when the API starts, then every hour. A failed run is
// logged and tried again next hour.
public class GuestCleanupWorker(
    IServiceScopeFactory scopes,
    ILogger<GuestCleanupWorker> log) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                var guests = scope.ServiceProvider.GetRequiredService<GuestAccounts>();
                var deleted = await guests.DeleteExpiredAsync(stoppingToken);
                if (deleted > 0)
                    log.LogInformation("Deleted {Count} expired guest accounts.", deleted);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                log.LogError(ex, "Guest cleanup failed. Will try again next hour.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}