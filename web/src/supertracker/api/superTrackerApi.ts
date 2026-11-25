import { apiFetch } from '../../utils/api'

// SuperTracker2 endpoints (api/SuperTracker/SuperTrackerController.cs).
// Height and weight are stored in metric; utils/units.ts converts them.

export type Sex = 'female' | 'male'
export type Activity = 'sedentary' | 'moderate' | 'active'
export type Units = 'us' | 'metric'

export type Profile = {
  age: number
  sex: Sex
  heightCm: number
  weightKg: number
  activity: Activity
  units: Units
  calorieGoal: number | null
  updatedAt: string
}

export type ProfileInput = Omit<Profile, 'updatedAt'>

export type Me = {
  termsVersion: string
  termsRequired: boolean
  termsAccepted: boolean
  profile: Profile | null
}

export function getMe(): Promise<Me> {
  return apiFetch<Me>('/supertracker/me')
}

export function acceptTerms(version: string): Promise<void> {
  return apiFetch<void>('/supertracker/terms', { method: 'POST', body: { version } })
}

export function saveProfile(input: ProfileInput): Promise<Profile> {
  return apiFetch<Profile>('/supertracker/profile', { method: 'PUT', body: input })
}