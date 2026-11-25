import { apiFetch } from '../../utils/api'
import type { Meal } from './foodLogApi'

// My Combo endpoints (api/SuperTracker/CombosController.cs).

export type Combo = {
  id: number
  name: string
  itemCount: number
  kcal: number
  items: string[]
}

export function getCombos(): Promise<Combo[]> {
  return apiFetch<Combo[]>('/supertracker/combos')
}

export function saveComboFromMeal(date: string, meal: Meal, name: string): Promise<{ id: number }> {
  return apiFetch<{ id: number }>('/supertracker/combos/from-meal', {
    method: 'POST',
    body: { date, meal, name },
  })
}

export function addCombo(id: number, date: string, meal: Meal): Promise<{ added: number }> {
  return apiFetch<{ added: number }>(`/supertracker/combos/${id}/add`, {
    method: 'POST',
    body: { date, meal },
  })
}

export function removeCombo(id: number): Promise<void> {
  return apiFetch<void>(`/supertracker/combos/${id}`, { method: 'DELETE' })
}