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

// A saved book. Shape mirrors the book_session tables so moving this to the
// API later is a change in one storage module, not a change to the app.

export type SavedBook = {
  id: string
  kind: 'veggie' | 'secrets'
  title: string
  image: string
  vegetableCode: string | null
  attributes: string[]
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