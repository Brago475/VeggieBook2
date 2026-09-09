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