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