using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Everything about how a visitor proves who they are, in one place.
//
// Sessions are a cookie issued by the API: HttpOnly so page scripts can
// never read it, Secure so it only travels over HTTPS, SameSite=Lax so other
// sites cannot make requests that carry it. There are no tokens in
// localStorage.
//
// The cookie's contents are encrypted with ASP.NET's data protection keys.
// Those keys must survive a redeploy, or every deploy would sign everyone
// out, so in production they live in a Docker volume (DataProtection__KeysPath).
//
// Passwords are hashed with ASP.NET Core's PasswordHasher (PBKDF2, random salt
// per user). Nothing here implements cryptography by hand.

public static class AuthSetup
{
    public const string RateLimitPolicy = "auth";

    // Claim holding the security stamp the session was issued with.
    public const string StampClaim = "vb2:stamp";

    public static IServiceCollection AddVeggieBookAuth(
        this IServiceCollection services,
        IConfiguration config,
        IWebHostEnvironment env)
    {
        var keysPath = config["DataProtection:KeysPath"];
        var dataProtection = services
            .AddDataProtection()
            .SetApplicationName("VeggieBook2");

        if (!string.IsNullOrWhiteSpace(keysPath))
        {
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keysPath));
        }
        else if (!env.IsDevelopment())
        {
            // Same rule as the connection string: fail loudly at startup
            // rather than run with keys that vanish on the next deploy.
            throw new InvalidOperationException(
                "DataProtection__KeysPath is not set.");
        }

        services.AddSingleton<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();

        services
            .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = "vb2_session";
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Lax;

                // Stay signed in for 30 days, renewed while the site is used.
                options.ExpireTimeSpan = TimeSpan.FromDays(30);
                options.SlidingExpiration = true;

                options.Events = new CookieAuthenticationEvents
                {
                    // This is an API, so answer with status codes instead of
                    // redirecting to a login page that does not exist.
                    OnRedirectToLogin = ctx =>
                    {
                        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    },
                    OnRedirectToAccessDenied = ctx =>
                    {
                        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    },
                    OnValidatePrincipal = ValidateStamp
                };
            });

        services.AddAuthorization();

        // Limits sign-in and sign-up attempts per visitor. Per-account
        // lockout stops guessing one password; this stops one visitor from
        // trying passwords across many accounts.
        //
        // 30 a minute leaves room for a class signing up together from campus,
        // where many students share one public IP address.
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(RateLimitPolicy, http =>
                RateLimitPartition.GetFixedWindowLimiter(
                    ClientIp(http),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 30,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
        });

        return services;
    }

    // The visitor's real address. Every request arrives through the
    // Cloudflare Tunnel, which puts the address in CF-Connecting-IP. That
    // header is only trustworthy because web is bound to 127.0.0.1, so the
    // tunnel is the only way to reach the site (see docker-compose.yml).
    public static string ClientIp(HttpContext http)
    {
        var cf = http.Request.Headers["CF-Connecting-IP"].ToString();
        if (!string.IsNullOrWhiteSpace(cf)) return cf;
        return http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    public static Guid? UserId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : null;

    // The session holds only the user's id and security stamp. Email and
    // everything else is read from the database when needed.
    public static ClaimsPrincipal CreatePrincipal(AppUser user)
    {
        var identity = new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(StampClaim, user.SecurityStamp.ToString())
            },
            CookieAuthenticationDefaults.AuthenticationScheme);

        return new ClaimsPrincipal(identity);
    }

    // Runs on every request that carries a session cookie. The session is
    // rejected if the account no longer exists (deleted) or its stamp has
    // changed (password changed), which signs out every device at once.
    // It is one primary-key lookup, cheap at this scale.
    private static async Task ValidateStamp(CookieValidatePrincipalContext ctx)
    {
        var id = ctx.Principal is null ? null : UserId(ctx.Principal);
        var claimed = ctx.Principal?.FindFirstValue(StampClaim);

        if (id is null || !Guid.TryParse(claimed, out var stamp))
        {
            await Reject(ctx);
            return;
        }

        var db = ctx.HttpContext.RequestServices.GetRequiredService<AccountsContext>();
        var current = await db.Users
            .AsNoTracking()
            .Where(u => u.Id == id.Value)
            .Select(u => (Guid?)u.SecurityStamp)
            .FirstOrDefaultAsync();

        if (current != stamp) await Reject(ctx);
    }

    private static async Task Reject(CookieValidatePrincipalContext ctx)
    {
        ctx.RejectPrincipal();
        await ctx.HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);
    }
}