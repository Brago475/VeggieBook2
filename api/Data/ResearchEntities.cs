namespace VeggieBook.Api.Data;

// Entities for research data, mapped in AccountsContext onto tables from
// db/migrations. Kept apart from AccountEntities.cs because they exist for
// the research sheets, not for running the app.

// One account's anonymous research ID (VB2-K7M4-Q9PX).
// See db/migrations/006_research_participant.sql and
// Research/ParticipantIds.cs.
public class ResearchParticipant
{
    public Guid UserId { get; set; }
    public string ParticipantId { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}