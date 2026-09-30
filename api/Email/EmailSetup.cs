using System.Net.Http.Headers;

namespace VeggieBook.Api.Email;

public record EmailSettings(string From);

public static class EmailSetup
{
    // Email__ResendApiKey set: real emails through Resend.
    // Not set: emails print to the API log (testing only).
    public static IServiceCollection AddVeggieBookEmail(
        this IServiceCollection services, IConfiguration config)
    {
        var apiKey = config["Email:ResendApiKey"];
        var from = config["Email:From"];
        if (string.IsNullOrWhiteSpace(from))
            from = "VeggieBook <no-reply@veggiebook2.com>";

        services.AddSingleton(new EmailSettings(from));
        services.AddSingleton<EmailQueue>();
        services.AddHostedService<EmailWorker>();

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            services.AddTransient<IMailer, LogMailer>();
        }
        else
        {
            services.AddHttpClient<ResendMailer>(c =>
            {
                c.BaseAddress = new Uri("https://api.resend.com/");
                c.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", apiKey);
                c.Timeout = TimeSpan.FromSeconds(15);
            });
            services.AddTransient<IMailer>(sp => sp.GetRequiredService<ResendMailer>());
        }

        return services;
    }
}