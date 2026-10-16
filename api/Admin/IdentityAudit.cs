using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// The identity record history (db/migrations/012_identity_audit.sql): one
// line each time the main admin opens Identity records or reveals a research
// ID. Separate from the activity log, so it never reaches research data.
//
// Written with plain SQL so the table needs no entity class. Unlike the
// activity log, callers treat a failed write as a failed action: records are
// shown only when the opening is recorded.

public static class IdentityAudit
{
    public const string Opened = "identity_opened";
    public const string Revealed = "research_id_revealed";

    public static Task RecordAsync(AccountsContext db, string action, string adminEmail, Guid? targetUserId) =>
        targetUserId is Guid target
            ? db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO identity_audit (action, admin_email, target_user_id)
                VALUES ({action}, {adminEmail}, {target})
                """)
            : db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO identity_audit (action, admin_email)
                VALUES ({action}, {adminEmail})
                """);

    public static Task<List<IdentityAuditRow>> LatestAsync(AccountsContext db, int take) =>
        db.Database
            .SqlQuery<IdentityAuditRow>($"""
                SELECT at AS "At", action AS "Action", admin_email AS "AdminEmail", target_user_id AS "TargetUserId"
                FROM identity_audit
                ORDER BY at DESC, id DESC
                LIMIT {take}
                """)
            .ToListAsync();
}

public sealed class IdentityAuditRow
{
    public DateTime At { get; set; }
    public string Action { get; set; } = "";
    public string AdminEmail { get; set; } = "";
    public Guid? TargetUserId { get; set; }
}