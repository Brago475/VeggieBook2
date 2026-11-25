import { apiFetch } from '../../utils/api'

// SuperTracker2 food endpoints (api/SuperTracker/FoodLogController.cs and
// FoodsController.cs). Dates are the calendar day on this device, as
// yyyy-MM-dd. Food names are English only (USDA data).

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

// Amounts for one food or a whole day. Vegetables, fruits and dairy are
// cups; whole grains ounce equivalents; healthy fats teaspoons of oil.
export type Amounts = {
  kcal: number
  vegetables: number
  fruits: number
  dairy: number
  wholeGrains: number
  healthyFats: number
  proteinG: number
  sodiumMg: number
  satFatG: number
  addedSugarG: number
  fiberG: number
  potassiumMg: number
  vitaminCMg: number
}

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
  foodId: number
  name: string
  vegetableKey: string | null
  meal: Meal | null
  portion: string
  quantity: number
  grams: number
  amounts: Amounts
}

export type DayTotals = Amounts

export type Day = {
  date: string
  entries: DayEntry[]
  totals: DayTotals
}

export type FoodHit = {
  id: number
  name: string
  category: string | null
  portion: string | null
  portionGrams: number | null
  kcal: number | null
}

export type FoodPortion = {
  id: number
  description: string
  grams: number
  increment: number
  isDefault: boolean
}

export type FoodDetail = {
  id: number
  name: string
  categories: string[]
  isFavorite: boolean
  portions: FoodPortion[]
  per100g: Amounts
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

export function searchFoods(q: string, category: string | null): Promise<FoodHit[]> {
  const params = new URLSearchParams({ q })
  if (category) params.set('category', category)
  return apiFetch<FoodHit[]>(`/supertracker/foods/search?${params.toString()}`)
}

export function getRecentFoods(): Promise<FoodHit[]> {
  return apiFetch<FoodHit[]>('/supertracker/foods/recent')
}

export function getFavoriteFoods(): Promise<FoodHit[]> {
  return apiFetch<FoodHit[]>('/supertracker/foods/favorites')
}

export function getFood(id: number): Promise<FoodDetail> {
  return apiFetch<FoodDetail>(`/supertracker/foods/${id}`)
}

export function setFavorite(id: number, on: boolean): Promise<{ isFavorite: boolean }> {
  return apiFetch<{ isFavorite: boolean }>(`/supertracker/foods/${id}/favorite`, {
    method: 'PUT',
    body: { on },
  })
}

export function addFood(
  date: string,
  input: { foodId: number; portionId: number; quantity: number; meal: Meal },
): Promise<{ id: number }> {
  return apiFetch<{ id: number }>(`/supertracker/days/${date}/foods`, { method: 'POST', body: input })
}

export function addVegetable(
  date: string,
  key: string,
  cups: number,
  meal: Meal | null = null,
): Promise<{ id: number }> {
  return apiFetch<{ id: number }>(`/supertracker/days/${date}/vegetables`, {
    method: 'POST',
    body: { key, cups, meal },
  })
}

export function copyMeal(date: string, fromDate: string, meal: Meal): Promise<{ copied: number }> {
  return apiFetch<{ copied: number }>(`/supertracker/days/${date}/copy`, {
    method: 'POST',
    body: { fromDate, meal },
  })
}

export function deleteEntry(id: number): Promise<void> {
  return apiFetch<void>(`/supertracker/entries/${id}`, { method: 'DELETE' })
}