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

export type Range = { min: number; max: number }

export type FoodGroup = 'vegetables' | 'fruits' | 'dairy' | 'wholeGrains' | 'protein' | 'healthyFats'

export type Plan = {
  estimatedCalories: number
  calories: number
  level: number
  fromGoal: boolean
  servings: Record<FoodGroup, Range>
  proteinGrams: Range
  limits: { sodiumMg: number; saturatedFatG: number }
  activityMinutesPerWeek: number
}

export type Me = {
  termsVersion: string
  termsRequired: boolean
  termsAccepted: boolean
  profile: Profile | null
  plan: Plan | null
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