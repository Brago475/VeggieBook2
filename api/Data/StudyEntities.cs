namespace VeggieBook.Api.Data;

// Entities for studies and research tracking, mapped in AccountsContext onto
// tables from db/migrations/008_studies.sql (and 009_study_name.sql for the
// study's name). See Research/StudyTracking.cs for the rules.
//
// Timestamps are UTC (DateTime.UtcNow), like every other entity.

// One change to an account's tracking: turned off or back on, by the person
// (ChangedBy = "self") or by an admin ("admin", with AdminId). No changes for
// an account means tracking is on, the default.
public class TrackingChange
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public bool TrackingOn { get; set; }
    public string ChangedBy { get; set; } = "self";
    public Guid? AdminId { get; set; }
    public DateTime At { get; set; }
}

// One study: switched on at StartedAt, switched off at EndedAt (null while
// it runs). Number is what the admin site shows: Study 1, Study 2, and so on.
// Name is optional ("Fall pilot"); without one the site shows "Study N".
public class Study
{
    public int Id { get; set; }
    public int Number { get; set; }
    public string? Name { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public Guid? StartedBy { get; set; }
    public Guid? EndedBy { get; set; }
}

// The study notice, for one person in one study: when they saw it and what
// they chose ("joined" or "stayed_out"; null until they answer).
public class StudyNotice
{
    public int StudyId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ShownAt { get; set; }
    public string? Answer { get; set; }
    public DateTime? AnsweredAt { get; set; }
}