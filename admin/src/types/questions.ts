// Response shape of GET /api/admin/question-analytics
// (api/Admin/AdminQuestionAnalyticsController.cs).

export type QaChoice = { attribute: string; text: string }

export type QaQuestion = { no: number; text: string; choices: QaChoice[] }

export type QaBook = {
  p: number // participant index, unique within one response
  kind: 'veggie' | 'secrets'
  language: string
  ageRange: string | null
  vegetableCode: string | null
  secretCategoryId: number | null
  week: string // Monday of the week saved, "yyyy-MM-dd"
  personalCover: boolean
  answers: string[] // choice attributes
  kept: number[] // recipe or secret ids
  removed: number[]
  extraCopies: number
}

export type QaItemInfo = { code: string | null; title: string; image: string | null }

export type QaData = {
  questions: QaQuestion[]
  vegetables: { code: string; name: string; image: string | null; active: boolean }[]
  categories: { id: number; name: string; image: string | null }[]
  recipes: Record<string, QaItemInfo>
  secrets: Record<string, QaItemInfo>
  books: QaBook[]
}