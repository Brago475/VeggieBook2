// Shapes of what the Books page loads.
//
//   /api/admin/books                        BooksResponse
//   /api/admin/books/{researchId}/{bookNo}  BookDetail
//       (both from api/Admin/AdminBooksPageController.cs)
//   /api/recipes/{id}                       VbRecipe, the same public
//                                           recipe the app opens
//   /api/secret-categories/{id}/secrets     VbSecretCategory, the same
//                                           public secrets the app opens
//
// savedAt is the time the book was saved, in Eastern time, with no zone
// ("2026-10-11T15:14:00"), the same as the All Data files.

export type BookKind = 'veggie' | 'secrets'

export type BookSummary = {
  key: string // "VB2-K7M4-Q9PX-3": research ID and book number
  researchId: string
  bookNo: number // 1 is the person's first book
  kind: BookKind
  language: string // "en" or "es"
  savedAt: string
  subjectCode: string | null // vegetable code, or Secrets category id
  subject: string // "Broccoli", or "Breakfast"
  background: string | null // vegetable photo or category picture, under /images
  cover: string | null // built-in cover under /images, or null
  personalCover: boolean // an uploaded photo, never shown here
  kept: number
  removed: number // taken out later
}

export type BooksResponse = {
  counts: {
    all: number
    veggie: number
    secrets: number
    takenOut: number
  }
  books: BookSummary[]
}

export type BookItem = {
  type: 'recipe' | 'secret'
  id: number
  code: string | null // "BR-201" or "#5832"
  title: string
  image: string | null // under /images
  extraCopies: number
  missing: boolean // since removed from the content
}

export type BookDetail = {
  book: BookSummary
  vegetableCode: string | null
  secretCategoryId: number | null
  answers: { question: number; text: string }[]
  studies: { number: number; title: string }[]
  keptItems: BookItem[]
  removedItems: BookItem[]
}

export type VbRecipe = {
  id: number
  title: string
  photos: string[]
  ingredients: string[]
  steps: string[]
  notes?: string[]
  timeToPrepare: string | null
  timeToCook: string | null
  servings: string | null
  canBeMadeAhead: string | null
  canBeFrozen: string | null
  goodForLeftovers: string | null
}

export type VbSecret = {
  id: number
  headline: string
  body: string
  whyItWorks: string
  image: string | null
  links: { url: string; label: string | null }[]
  attachment: string | null
}

export type VbSecretCategory = {
  category: {
    name: string
    color: string // hex without the leading #
    image?: string | null
  }
  secrets: VbSecret[]
}