using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// The connection string comes from ConnectionStrings__Default in the
// environment, which docker-compose sets. There is no fallback on purpose:
// failing loudly at startup beats silently connecting somewhere unexpected.
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException(
        "ConnectionStrings__Default is not set.");

builder.Services.AddDbContext<VeggieBookContext>(options =>
    options.UseNpgsql(connectionString)
           // Content is read-only, so tracking is pure overhead. User data
           // lives in AccountsContext below, so this context never writes.
           .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

// User data: accounts now, saved books next. Same database, separate
// context. Tracking stays on because this context writes.
builder.Services.AddDbContext<AccountsContext>(options =>
    options.UseNpgsql(connectionString));

// Session cookies, password hashing, and rate limits. See Auth/AuthSetup.cs.
builder.Services.AddVeggieBookAuth(builder.Configuration, builder.Environment);

// Only needed while the front end runs on the Vite dev server on a different
// origin. In production both are served from veggiebook2.com through nginx,
// so the browser never makes a cross-origin request.
builder.Services.AddCors(options =>
    options.AddPolicy("dev", policy => policy
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("dev");
}

// Order matters. Authentication reads the session cookie, authorization
// enforces [Authorize] using it, and the rate limiter applies the per-endpoint
// limits. All three must run before the endpoints they protect.
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

// Used by the Docker healthcheck. Confirms the database is reachable, not
// merely that the process is alive.
app.MapGet("/api/health", async (VeggieBookContext db) =>
{
    var ok = await db.Database.CanConnectAsync();
    return ok ? Results.Ok(new { status = "ok" })
              : Results.StatusCode(503);
});

app.Run();
