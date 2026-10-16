import type { StudySummary } from './studies'

// Shapes of what the participants API sends
// (api/Admin/AdminParticipantsController.cs). Dates are ISO strings (UTC).

// on: tracked. off_self: they turned it off in Settings (only they can turn
// it back on). off_admin: an admin turned it off (an admin can undo it).
export type TrackingStatus = 'on' | 'off_self' | 'off_admin'

export type TrackingChange = {
  on: boolean
  by: 'self' | 'admin'
  at: string
}

export type Participant = {
  researchId: string
  ageRange: string | null
  joinedAt: string
  status: TrackingStatus
  tracking: { on: boolean; changedBy: 'self' | 'admin' | null; changedAt: string | null }
  changes: TrackingChange[] // oldest first; empty means on since they joined
  notice: { shownAt: string; answer: 'joined' | 'stayed_out' | null; answeredAt: string | null } | null
  books: number // only books saved while tracking was on
  veggieBooks: number
  secretsBooks: number
  latestBookAt: string | null
}

// GET /api/admin/participants
export type ParticipantsResponse = {
  study: StudySummary | null // the running study
  counts: { all: number; on: number; offSelf: number; offAdmin: number }
  people: Participant[] // newest first
}