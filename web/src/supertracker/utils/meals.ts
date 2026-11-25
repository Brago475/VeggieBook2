import type { Amounts, Meal } from '../api/foodLogApi'

// The meal that fits the time of day on this device.
export function mealNow(now: Date = new Date()): Meal {
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (minutes < 10 * 60 + 30) return 'breakfast'
  if (minutes < 15 * 60) return 'lunch'
  if (minutes < 21 * 60) return 'dinner'
  return 'snack'
}

// Per-100 g amounts scaled to a weight in grams.
export function scale(per100: Amounts, grams: number): Amounts {
  const k = grams / 100
  return {
    kcal: per100.kcal * k,
    vegetables: per100.vegetables * k,
    fruits: per100.fruits * k,
    dairy: per100.dairy * k,
    wholeGrains: per100.wholeGrains * k,
    healthyFats: per100.healthyFats * k,
    proteinG: per100.proteinG * k,
    sodiumMg: per100.sodiumMg * k,
    satFatG: per100.satFatG * k,
    addedSugarG: per100.addedSugarG * k,
    fiberG: per100.fiberG * k,
    potassiumMg: per100.potassiumMg * k,
    vitaminCMg: per100.vitaminCMg * k,
  }
}