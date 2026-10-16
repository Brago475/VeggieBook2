import { apiFetch } from './api'

// The account's profile (see api/Auth/ProfileController.cs).
//
// After a save, notifyProfileChanged tells hooks/useAuth.ts to ask the API
// who is signed in again, so the home screen shows the new username without
// a page refresh.

export type Profile = {
  firstName: string | null
  lastName: string | null
  displayName: string | null
  email: string | null
  ageRange: string | null
}

export const PROFILE_CHANGED = 'vb2-profile-changed'

export function getProfile() {
  return apiFetch<Profile>('/auth/profile')
}

export function saveProfile(firstName: string, lastName: string, displayName: string) {
  return apiFetch<Profile>('/auth/profile', {
    method: 'PUT',
    body: { firstName, lastName, displayName },
  })
}

export function notifyProfileChanged() {
  window.dispatchEvent(new Event(PROFILE_CHANGED))
}