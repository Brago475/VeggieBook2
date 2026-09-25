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
// from vegetableCode in the language being shown. A Secrets Book is named
// after its category, looked up from secretCategoryId the same way.
//
// recipeCount counts what the book holds: recipes in a VeggieBook, secrets
// in a Secrets Book.

export type BookSummary = {
  id: string
  kind: 'veggie' | 'secrets'
  vegetableCode: string | null
  // Secrets Books only. Optional so older lists without it still work.
  secretCategoryId?: number | null
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

// What POST /api/books/secrets expects. No answers. Exactly one of
// coverPath or coverUpload is set, the same as NewBook: any secret's
// picture, or a JPEG data URL from resizeImage().

export type NewSecretsBook = {
  categoryId: number
  secrets: { id: number; extraCopies: number }[]
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

// --- Secrets Book ---------------------------------------------------------

// One of the five categories from GET /api/secret-categories. color is hex
// without the leading #, the same as recipe badges. image is a path under
// /images (secretCat/Breakfast_button3.png).

export type SecretCategory = {
  id: number
  name: string
  image: string
  color: string
  secretCount: number
}

export type SecretLink = {
  url: string
  label: string | null
}

// One secret, in full. A Secrets Book has no questions and no separate
// detail request: the review screen gets everything it shows from here.
//
// image is the Spanish illustration for a Spanish request when there is
// one, otherwise the shared one. attachment is a path under /images
// (secret_attachments/...pdf) or null.

export type Secret = {
  id: number
  headline: string
  body: string | null
  whyItWorks: string
  image: string | null
  attachment: string | null
  links: SecretLink[]
}

// GET /api/secret-categories/{id}/secrets

export type CategorySecrets = {
  category: Omit<SecretCategory, 'secretCount'>
  secretCount: number
  secrets: Secret[]
}