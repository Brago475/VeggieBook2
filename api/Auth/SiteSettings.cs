using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// Site settings and daily guest counts (db/migrations/011_admin_settings.sql).
//
// Written with plain SQL so the tables need no entity classes. If the
// migration has not run yet, reads fall back to the defaults and the guest
// counter does nothing, so guests are never blocked by a missing table.

public static class SiteSettings
{
    public const string GuestsAllowedKey = "guests_allowed";

    private static readonly TimeZoneInfo Eastern = FindEastern();

    public static DateOnly Today() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Eastern));

    public static async Task<bool> GuestsAllowedAsync(AccountsContext db)
    {
        try
        {
            var value = await db.Database
                .SqlQuery<string>($"SELECT value AS \"Value\" FROM app_setting WHERE key = {GuestsAllowedKey}")
                .FirstOrDefaultAsync();
            return value != "false";
        }
        catch
        {
            return true;
        }
    }

    public static Task SetGuestsAllowedAsync(AccountsContext db, bool allowed, Guid? by) =>
        db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO app_setting (key, value, updated_at, updated_by)
            VALUES ({GuestsAllowedKey}, {(allowed ? "true" : "false")}, {DateTime.UtcNow}, {by})
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by
            """);

    // Adds one to today's guest count. Never throws.
    public static async Task CountGuestAsync(AccountsContext db)
    {
        try
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO guest_daily (day, started) VALUES ({Today()}, 1)
                ON CONFLICT (day) DO UPDATE SET started = guest_daily.started + 1
                """);
        }
        catch
        {
            // The count is a nice-to-have; a guest visit must still start.
        }
    }

    public static async Task<Dictionary<DateOnly, int>> GuestDaysAsync(AccountsContext db, DateOnly? from = null)
    {
        try
        {
            var start = from ?? DateOnly.MinValue;
            var rows = await db.Database
                .SqlQuery<GuestDayRow>($"SELECT day AS \"Day\", started AS \"Started\" FROM guest_daily WHERE day >= {start}")
                .ToListAsync();
            return rows.ToDictionary(r => r.Day, r => r.Started);
        }
        catch
        {
            return [];
        }
    }

    private static TimeZoneInfo FindEastern()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}

public sealed class GuestDayRow
{
    public DateOnly Day { get; set; }
    public int Started { get; set; }
}