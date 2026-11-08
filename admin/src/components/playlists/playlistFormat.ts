import type { BrowseItem, MealCount, MealKey, PickedItem, PlaylistEntry, PlaylistKind } from '../../types/playlists'

// Limits and wording shared by the playlist screens.
// Limits match api/Playlists/PlaylistHelpers.cs and AdminPlaylistsController.cs.

export const MAX_NAME = 80
export const MAX_ITEMS = 60

export const MEAL_ORDER: MealKey[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function itemKey(kind: PlaylistKind, id: number): string {
  return `${kind}:${id}`
}

export function plural(n: number, word: string): string {
  return n === 1 ? `1 ${word}` : `${n} ${word}s`
}

// "2 tips and 4 recipes"
export function countText(tips: number, recipes: number): string {
  return `${plural(tips, 'tip')} and ${plural(recipes, 'recipe')}`
}

// "4 recipes, 1 tip", or "Nothing yet".
export function shortCount(tips: number, recipes: number): string {
  const parts: string[] = []
  if (recipes > 0) parts.push(plural(recipes, 'recipe'))
  if (tips > 0) parts.push(plural(tips, 'tip'))
  return parts.length > 0 ? parts.join(', ') : 'Nothing yet'
}

// Labeled tips and recipes for one meal, for one vegetable or all.
export function mealCount(counts: MealCount[], meal: MealKey, vegetable: string) {
  const rows = counts.filter((c) => c.meal === meal && (!vegetable || c.vegetable === vegetable))
  return {
    tips: rows.reduce((sum, c) => sum + c.tips, 0),
    recipes: rows.reduce((sum, c) => sum + c.recipes, 0),
  }
}

export function sortMeals(meals: MealKey[]): MealKey[] {
  return MEAL_ORDER.filter((m) => meals.includes(m))
}

export function pickedFromEntry(entry: PlaylistEntry): PickedItem {
  return {
    kind: entry.kind,
    id: entry.id,
    title: entry.title,
    vegetableName: entry.vegetableName,
    code: entry.kind === 'recipe' ? entry.code : null,
    photo: entry.kind === 'recipe' ? entry.photo : null,
  }
}

export function pickedFromBrowse(item: BrowseItem): PickedItem {
  return {
    kind: item.kind,
    id: item.id,
    title: item.title,
    vegetableName: item.vegetableName,
    code: item.code,
    photo: item.photo,
  }
}