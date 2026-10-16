// Shapes of the content the admin site opens.

// GET /api/recipes/{id}, the public endpoint. Matches RecipeDetail in
// web/src/types/index.ts; keep the two the same.
export type RecipeDetail = {
  id: number
  code: string
  vegetable: string
  title: string
  storyLine: string
  timeToPrepare: string
  timeToCook: string
  servings: string
  canBeMadeAhead: string
  canBeFrozen: string
  goodForLeftovers: string
  ingredients: string[]
  steps: string[]
  notes: string[]
  photos: string[]
}

// GET /api/admin/content/secrets/{id} (api/Admin/AdminContentController.cs)
export type SecretDetail = {
  id: number
  number: number
  active: boolean
  category: string | null
  headline: string
  body: string | null
  whyItWorks: string
  image: string | null
  attachment: string | null
  links: { url: string; label: string | null }[]
}

// GET /api/admin/content/library (api/Admin/AdminContentController.cs)
export type LibraryVegetable = {
  code: string
  shortCode: string
  name: string
  image: string | null
  active: boolean
}

export type LibraryRecipe = {
  id: number
  code: string | null
  vegetable: string
  title: string
  active: boolean
  photo: string | null
  kept: number
  takenOut: number
}

export type LibraryCategory = {
  id: number
  name: string
  image: string | null
}

export type LibrarySecret = {
  id: number
  number: number
  active: boolean
  category: number | null
  headline: string
  image: string | null
  kept: number
  takenOut: number
}

export type ContentLibrary = {
  vegetables: LibraryVegetable[]
  recipes: LibraryRecipe[]
  categories: LibraryCategory[]
  secrets: LibrarySecret[]
}

export type ContentKind = 'recipe' | 'secret'