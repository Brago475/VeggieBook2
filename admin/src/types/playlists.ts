// Shapes of /api/admin/playlists and /api/admin/meal-labels
// (api/Admin/AdminPlaylistsController.cs, AdminMealLabelsController.cs).

export type PlaylistKind = 'tip' | 'recipe'
export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type PlaylistSummary = {
  id: number
  version: number
  nameEn: string
  nameEs: string | null
  auto: boolean
  autoVegetable: string | null
  autoMeal: MealKey | null
  archived: boolean
  archivedAt: string | null
  createdAt: string
  // Admin usernames; null on older playlists.
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
  tips: number
  recipes: number
  // Up to four image paths, in playlist order, for the card collage.
  photos: string[]
  kept: number
  notKept: number
  sent: number
  live: boolean
}

export type PlaylistItemRef = { kind: PlaylistKind; id: number }

export type TipBlock = { text: string; image: string | null }

export type RecipeEntry = {
  kind: 'recipe'
  id: number
  vegetable: string
  vegetableName: string
  code: string | null
  title: string
  timeToPrepare: string
  timeToCook: string
  servings: string
  photo: string | null
}

export type TipEntry = {
  kind: 'tip'
  id: number
  vegetable: string
  vegetableName: string
  title: string
  blocks: TipBlock[]
}

// An item as the app shows it, in one language.
export type PlaylistEntry = RecipeEntry | TipEntry

export type PlaylistDetail = {
  id: number
  version: number
  nameEn: string
  nameEs: string | null
  auto: boolean
  autoVegetable: string | null
  autoMeal: MealKey | null
  archived: boolean
  archivedAt: string | null
  createdAt: string
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
  items: PlaylistEntry[]
}

export type PlaylistVegetable = { code: string; name: string; nameEs?: string; image: string | null }

export type PlaylistMeal = { key: MealKey; en: string; es?: string }

export type MealCount = { vegetable: string; meal: MealKey; tips: number; recipes: number }

export type PlaylistOptions = {
  vegetables: PlaylistVegetable[]
  meals: PlaylistMeal[]
  counts: MealCount[]
}

export type BrowseItem = {
  kind: PlaylistKind
  id: number
  vegetable: string
  vegetableName: string
  title: string
  meals: MealKey[]
  code: string | null
  photo: string | null
  snippet: string | null
  blocks: number
}

export type BrowseResult = {
  tipCount: number
  recipeCount: number
  tips: BrowseItem[]
  recipes: BrowseItem[]
}

// One item in the editor's list, with what is needed to show it.
export type PickedItem = {
  kind: PlaylistKind
  id: number
  title: string
  vegetableName: string
  code: string | null
  photo: string | null
}

// version is the one the editor opened with; left out when creating.
export type PlaylistDraft = {
  nameEn: string
  nameEs: string | null
  items: PlaylistItemRef[]
  version?: number | null
}

// Meal labels screen.
export type LabelItem = {
  kind: PlaylistKind
  id: number
  code: string | null
  vegetable: string
  title: string
  photo: string | null
  snippet: string | null
  meals: MealKey[]
}

export type MealLabelsResponse = {
  meals: PlaylistMeal[]
  vegetables: PlaylistVegetable[]
  recipes: LabelItem[]
  tips: LabelItem[]
}