using Microsoft.EntityFrameworkCore;
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
           // Content is read-only, so tracking is pure overhead. Any write
           // path added later must opt back in per query.
           .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

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
