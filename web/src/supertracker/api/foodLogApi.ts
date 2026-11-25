import { apiFetch } from '../../utils/api'

// SuperTracker2 food log endpoints (api/SuperTracker/FoodLogController.cs).
// Dates are the calendar day on this device, as yyyy-MM-dd.

export type PerAmount = {
  servings: number
  kcal: number
  fiberG: number
  vitaminCMg: number
  potassiumMg: number
}

export type VegetableChoice = {
  key: string
  vegetable: string
  name: string
  perCup: PerAmount
}

export type DayEntry = {
  id: number
  name: string
  vegetableKey: string | null
  portion: string
  quantity: number
  vegetables: number
  kcal: number
}

export type DayTotals = {
  vegetables: number
  fruits: number
  dairy: number
  wholeGrains: number
  healthyFats: number
  proteinG: number
  kcal: number
  sodiumMg: number
  satFatG: number
  fiberG: number
  potassiumMg: number
  vitaminCMg: number
}

export type Day = {
  date: string
  entries: DayEntry[]
  totals: DayTotals
}

function lang(): string {
  return typeof document !== 'undefined' && document.documentElement.lang === 'es' ? 'es' : 'en'
}

export function getVegetables(): Promise<VegetableChoice[]> {
  return apiFetch<VegetableChoice[]>(`/supertracker/vegetables?lang=${lang()}`)
}

export function getDay(date: string): Promise<Day> {
  return apiFetch<Day>(`/supertracker/days/${date}?lang=${lang()}`)
}

export function addVegetable(date: string, key: string, cups: number): Promise<{ id: number }> {
  return apiFetch<{ id: number }>(`/supertracker/days/${date}/vegetables`, {
    method: 'POST',
    body: { key, cups },
  })
}

export function deleteEntry(id: number): Promise<void> {
  return apiFetch<void>(`/supertracker/entries/${id}`, { method: 'DELETE' })
}