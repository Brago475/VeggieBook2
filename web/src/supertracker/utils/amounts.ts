import type { Amounts } from '../api/foodLogApi'

// Amount helpers shared by Edit food and Food-A-Pedia.

export function parseAmount(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(n) ? n : null
}

// Every amount multiplied by k.
export function times(a: Amounts, k: number): Amounts {
  const out = { ...a }
  for (const key of Object.keys(out) as (keyof Amounts)[]) out[key] = a[key] * k
  return out
}

export type NutrientUnit = 'kcal' | 'cups' | 'ozEq' | 'tsp' | 'g' | 'mg'

// Row order and units for nutrition tables. Units follow the Dietary
// Guidelines, 2025-2030.
export const NUTRIENTS: { key: keyof Amounts; unit: NutrientUnit }[] = [
  { key: 'kcal', unit: 'kcal' },
  { key: 'vegetables', unit: 'cups' },
  { key: 'fruits', unit: 'cups' },
  { key: 'dairy', unit: 'cups' },
  { key: 'wholeGrains', unit: 'ozEq' },
  { key: 'healthyFats', unit: 'tsp' },
  { key: 'proteinG', unit: 'g' },
  { key: 'fiberG', unit: 'g' },
  { key: 'sodiumMg', unit: 'mg' },
  { key: 'satFatG', unit: 'g' },
  { key: 'addedSugarG', unit: 'g' },
  { key: 'potassiumMg', unit: 'mg' },
  { key: 'vitaminCMg', unit: 'mg' },
]