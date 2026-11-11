// Shapes of what the studies API sends. They match the anonymous objects in
// api/Research/StudyData.cs and api/Admin/AdminStudiesController.cs.
// Dates arrive as ISO strings (UTC).

// Someone with tracking off, shown by research ID only. by is "self" when
// they turned it off in Settings, "admin" when an admin did.
export type OffPerson = {
  researchId: string
  by: 'self' | 'admin'
  since: string | null
}

export type StudySummary = {
  id: number
  number: number
  name: string | null // given by an admin; null shows as "Study 3"
  startedAt: string
  endedAt: string | null
  running: boolean
  days: number // day 1 is the day it was switched on
  people: number
  tracked: number
  trackingOff: number
  offIds: OffPerson[]
  notice: {
    shown: number
    joined: number
    stayedOut: number
  }
  booksSaved: number
  // Admin usernames, merged in by useStudies; null when not recorded.
  startedBy?: string | null
  endedBy?: string | null
}

// Who a study switched on right now would include.
export type StudyPreview = {
  people: number
  tracked: number
  trackingOff: number
  offIds: OffPerson[]
}

// Who switched each study on and off.
export type StudyAdmins = {
  id: number
  startedBy: string | null
  endedBy: string | null
}

// GET /api/admin/studies
export type StudiesResponse = {
  running: boolean
  nextNumber: number
  preview: StudyPreview
  studies: StudySummary[] // newest first
  admins?: StudyAdmins[]
}