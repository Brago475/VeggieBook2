using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Everything about how a visitor proves who they are, in one place.
//
// Accounts, passwords, lockout, password reset, and roles are ASP.NET Core
// Identity. Nothing here implements security by hand.
//
// Sessions are Identity's cookie: HttpOnly so page scripts can never read it,
// Secure so it only travels over HTTPS, SameSite=Lax so other sites cannot
// make requests that carry it. There are no tokens in localStorage.
//
// The cookie is encrypted with ASP.NET's data protection keys. Those keys must
// survive a redeploy, or every deploy would sign everyone out, so in
// production they live in a Docker volume (DataProtection__KeysPath).

public static class AuthSetup
{
    public const string RateLimitPolicy = "auth";
    public const string GuestRateLimitPolicy = "guest";
    public const int MinPasswordLength = 8;
    public const int MaxPasswordLength = 128;

    public static IServiceCollection AddVeggieBookAuth(
        this IServiceCollection services,
        IConfiguration config,
        IWebHostEnvironment env)
    {
        // Data protection keys: encrypt the cookie and sign reset tickets.
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
            // Fail loudly at startup rather than run with keys that vanish
            // on the next deploy.
            throw new InvalidOperationException("DataProtection__KeysPath is not set.");
        }

        // The site's public address, for links in emails.
        var publicUrl = config["App:PublicUrl"];
        if (string.IsNullOrWhiteSpace(publicUrl))
        {
            if (!env.IsDevelopment())
                throw new InvalidOperationException("App__PublicUrl is not set.");
            publicUrl = "http://localhost:5173";
        }
        services.AddSingleton(new AuthLinks(publicUrl));

        services
            .AddIdentityCore<AppUser>(o =>
            {
                // One account per email. The user name is always the email
                // (or guest-<id> for a guest), which the API sets itself, so
                // any character is allowed.
                o.User.RequireUniqueEmail = true;
                o.User.AllowedUserNameCharacters = "";

                // Accounts can sign in right after sign-up. The email is not
                // confirmed for now; this can be turned back on later.
                o.SignIn.RequireConfirmedEmail = false;

                // At least 8 characters with an uppercase letter, a lowercase
                // letter, and a special character. AuthHelpers.CheckPassword
                // checks the same rule first, with one clear message.
                o.Password.RequiredLength = MinPasswordLength;
                o.Password.RequireDigit = false;
                o.Password.RequireLowercase = true;
                o.Password.RequireUppercase = true;
                o.Password.RequireNonAlphanumeric = true;
                o.Password.RequiredUniqueChars = 1;

                // Five wrong passwords lock sign-in for 15 minutes.
                o.Lockout.AllowedForNewUsers = true;
                o.Lockout.MaxFailedAccessAttempts = 5;
                o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<AccountsContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        // A reset ticket is handed out only after a correct PIN or security
        // answer, and is used right away, so it expires after 15 minutes.
        services.Configure<DataProtectionTokenProviderOptions>(o =>
            o.TokenLifespan = TimeSpan.FromMinutes(15));

        // Check the session against the database on every request. A changed
        // password, a deleted account, or a removed role takes effect
        // immediately instead of up to 30 minutes later. One lookup per
        // request is cheap at this scale.
        services.Configure<SecurityStampValidatorOptions>(o =>
            o.ValidationInterval = TimeSpan.Zero);

        services
            .AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddIdentityCookies();

        services.ConfigureApplicationCookie(o =>
        {
            o.Cookie.Name = "vb2_session";
            o.Cookie.HttpOnly = true;
            o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            o.Cookie.SameSite = SameSiteMode.Lax;

            // Accounts stay signed in for 30 days, renewed while the site is
            // used. Guests get a cookie that ends when the browser closes
            // (see GuestController).
            o.ExpireTimeSpan = TimeSpan.FromDays(30);
            o.SlidingExpiration = true;

            // This is an API, so answer with status codes instead of
            // redirecting to a login page. Only these two events are replaced;
            // Identity's session check stays in place.
            o.Events.OnRedirectToLogin = ctx =>
            {
                ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            o.Events.OnRedirectToAccessDenied = ctx =>
            {
                ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        });

        services.AddAuthorization(o =>
        {
            o.AddPolicy(Roles.MemberPolicy, p => p.RequireRole(Roles.User));
            o.AddPolicy(Roles.AdminPolicy, p => p.RequireRole(Roles.Admin));
        });

        // Guest accounts and the job that deletes expired ones.
        services.AddScoped<GuestAccounts>();
        services.AddHostedService<GuestCleanupWorker>();

        // The recovery PIN and security question. See AccountRecovery.cs.
        services.AddScoped<AccountRecovery>();

        // Per-visitor limits. Per-account limits stop guessing one account;
        // these stop one visitor from trying many accounts or filling the
        // database with guests.
        //
        // The numbers leave room for a class using the site together from
        // campus, where many students share one public IP address.
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
            options.AddPolicy(GuestRateLimitPolicy, http =>
                RateLimitPartition.GetFixedWindowLimiter(
                    ClientIp(http),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 20,
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

    // The signed-in account's id. The book controllers use this, and it
    // works the same for guests and accounts.
    public static Guid? UserId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : null;
}