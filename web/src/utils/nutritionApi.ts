import type { Lang } from '../i18n/language'
import type { NutritionItem, NutritionResponse } from '../types/nutrition'

// Nutrition facts for one vegetable, in the site language.

export async function fetchNutrition(code: string, lang: Lang): Promise<NutritionResponse> {
  const response = await fetch(`/api/vegetables/${encodeURIComponent(code)}/nutrition?lang=${lang}`)
  if (!response.ok) throw new Error(`nutrition: HTTP ${response.status}`)
  return response.json()
}

// "1 medium stalk (148 g/5.3 oz)"
export function servingText(item: NutritionItem): string {
  const grams = Number.isInteger(item.grams) ? String(item.grams) : item.grams.toFixed(1)
  return `${item.serving} (${grams} g/${item.ounces.toFixed(1)} oz)`
}