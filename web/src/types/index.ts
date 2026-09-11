// Shared types for the VeggieBook2 API.
//
// These mirror what the .NET API returns. Field names are camelCase because
// the API serializes them that way; they are snake_case in the database.

export type Vegetable = {
  code: string
  shortCode: string
  name: string
  image: string
  recipeCount: number
}

export type Choice = {
  id: number
  attribute: string
  text: string
  isDefault: boolean
}

export type Question = {
  id: number
  mnemonic: string
  intro: string
  subIntro: string
  choices: Choice[]
}

// A saved book as GET /api/books lists it.
//
// cover is either a preset path (cover/BR.jpg, served from /images) or, for
// an uploaded photo, a private API link (/api/books/{id}/cover) that only the
// book's owner can open. coverSrc() turns either one into an <img> src.
//
// There is no title: a VeggieBook is named after its vegetable, so the page
// looks the name up from vegetableCode in the language being shown.

export type BookSummary = {
  id: string
  kind: 'veggie' | 'secrets'
  vegetableCode: string | null
  cover: string
  recipeCount: number
  createdAt: string
}

// What POST /api/books expects. Exactly one of coverPath or coverUpload is
// set: a preset path, or a JPEG data URL from resizeImage().

export type NewBook = {
  vegetableCode: string
  attributes: string[]
  recipes: { id: number; extraCopies: number }[]
  coverPath?: string
  coverUpload?: string
  lang?: 'en' | 'es'
}

// The localStorage version of a book. Still used by App.tsx and
// HomeLibrary.tsx until they move to the API next session; delete it then,
// along with hooks/useSavedBooks.ts.

export type SavedBook = {
  id: string
  kind: 'veggie' | 'secrets'
  title: string
  image: string
  vegetableCode: string | null
  attributes: string[]
  recipeIds: number[]
  extraCopyIds: number[]
  createdAt: string
}

// Recipe summary as returned by POST /api/match. Ingredients and
// instructions are not included here; those come from /api/recipes/{id}.

export type Badge = {
  text: string
  color: string
}

export type RecipeSummary = {
  id: number
  code: string
  title: string
  timeToPrepare: string
  timeToCook: string
  servings: string
  photo: string
  badges: Badge[]
}

export type MatchResult = {
  vegetable: { code: string; name: string }
  recipeCount: number
  tipCount: number
  recipes: RecipeSummary[]
}

// Full recipe from GET /api/recipes/{id}. The match response returns only a
// summary; this is what the card needs.

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