// Shape of GET /api/vegetables/{code}/nutrition (api/Nutrition/NutritionController.cs).
// One item per kind of vegetable, raw, one serving, in the site language.

export type NutritionSource = 'fda' | 'fdc'

export type NutritionItem = {
  name: string
  serving: string
  grams: number
  ounces: number
  calories: number
  caloriesFromFat: number
  fatG: number
  fatDv: number
  sodiumMg: number
  sodiumDv: number
  potassiumMg: number
  potassiumDv: number
  carbsG: number
  carbsDv: number
  fiberG: number
  fiberDv: number
  sugarsG: number
  proteinG: number
  vitaminADv: number
  vitaminCDv: number
  calciumDv: number
  ironDv: number
  source: NutritionSource
  sourceUrl: string
}

export type NutritionResponse = {
  items: NutritionItem[]
}