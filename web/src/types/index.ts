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

// A saved book as GET /api/books lists it. A guest's unsaved book uses the
// same shape, so the home screen shows both the same way.
//
// cover is a preset path (cover/BR.jpg), a saved upload's private API link
// (/api/books/{id}/cover), or, for a guest, the photo's data URL.
// coverSrc() turns any of them into an <img> src.
//
// There is no title: a VeggieBook is named after its vegetable, looked up
// from vegetableCode in the language being shown.

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