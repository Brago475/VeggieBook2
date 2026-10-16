import { apiFetch } from './api'

// Research tracking and the study notice, for a signed-in account (see
// api/Research/TrackingController.cs).
//
//   Tracking   on by default. The person can turn it off and back on in
//              Profile and settings, unless the research team turned it off
//              (offByAdmin), which only the team can undo. The research ID
//              comes back only while tracking is on.
//   Notice     shown on the home screen only while a study runs, only to
//              people who turned tracking off themselves, and only until
//              they answer it once for that study. "joined" turns tracking
//              back on.
//
// Admin accounts get eligible: false and see neither.

export type Tracking =
  | { eligible: false }
  | {
      eligible: true
      on: boolean
      offByAdmin: boolean
      changedAt: string | null
      researchId: string | null
    }

export type StudyNotice = { show: false } | { show: true; studyNumber: number }

export function getTracking() {
  return apiFetch<Tracking>('/me/research')
}

export function setTracking(on: boolean) {
  return apiFetch<Tracking>('/me/research', { method: 'PUT', body: { on } })
}

export function getStudyNotice() {
  return apiFetch<StudyNotice>('/me/study-notice')
}

export function answerStudyNotice(answer: 'joined' | 'stayed_out') {
  return apiFetch<{ answer: string }>('/me/study-notice', { method: 'POST', body: { answer } })
}