import { apiFetch } from '../../utils/api'
import type { Meal } from './foodLogApi'

// Create My Food endpoints (api/SuperTracker/CustomFoodsController.cs).
// Values are per serving; food groups are servings one serving counts as.

export type CustomFood = {
  id: number
  name: string
  serving: string
  servingGrams: number | null
  kcal: number
  proteinG: number
  satFatG: number
  sodiumMg: number
  addedSugarG: number
  fiberG: number
  vegetables: number
  fruits: number
  dairy: number
  wholeGrains: number
  healthyFats: number
}

export type CustomFoodInput = Omit<CustomFood, 'id'>

export function getCustomFoods(): Promise<CustomFood[]> {
  return apiFetch<CustomFood[]>('/supertracker/custom-foods')
}

export function createCustomFood(input: CustomFoodInput): Promise<CustomFood> {
  return apiFetch<CustomFood>('/supertracker/custom-foods', { method: 'POST', body: input })
}

export function updateCustomFood(id: number, input: CustomFoodInput): Promise<CustomFood> {
  return apiFetch<CustomFood>(`/supertracker/custom-foods/${id}`, { method: 'PUT', body: input })
}

export function removeCustomFood(id: number): Promise<void> {
  return apiFetch<void>(`/supertracker/custom-foods/${id}`, { method: 'DELETE' })
}

export function addCustomFood(date: string, customFoodId: number, quantity: number, meal: Meal) {
  return apiFetch<{ id: number }>(`/supertracker/days/${date}/custom`, {
    method: 'POST',
    body: { customFoodId, quantity, meal },
  })
}