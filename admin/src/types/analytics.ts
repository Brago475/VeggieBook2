// Shape of GET /api/admin/analytics (api/Admin/AdminAnalyticsController.cs).
// If that response changes, change this to match.

export type DescriptiveRow = {
  variable: string
  n: number
  mean: number | null
  median: number | null
  sd: number | null
  min: number | null
  max: number | null
}

export type WeekActivity = {
  week: string
  signups: number
  veggieBooks: number
  secretsBooks: number
}

export type AnswerChoice = {
  attribute: string
  text: string
  count: number
  percent: number
}

export type QuestionStats = {
  id: number
  code: string
  text: string
  hidden: boolean
  choices: AnswerChoice[]
}

export type AnalyticsData = {
  generatedAt: string
  summary: {
    accounts: number
    veggieBooks: number
    secretsBooks: number
    personalCovers: number
    builtInCovers: number
    englishBooks: number
    spanishBooks: number
    recipesKept: number
    recipesRemoved: number
    secretsKept: number
    secretsRemoved: number
    extraCopies: number
  }
  weeks: WeekActivity[]
  vegetables: { code: string; name: string; image: string | null; books: number }[]
  secretCategories: { id: number; name: string; image: string | null; books: number }[]
  topCovers: { path: string; books: number }[]
  topRecipes: {
    id: number
    code: string | null
    title: string
    photo: string | null
    kept: number
    removed: number
  }[]
  topSecrets: {
    id: number
    number: number | null
    title: string
    image: string | null
    kept: number
    removed: number
  }[]
  ageRanges: { label: string; accounts: number }[]
  questions: QuestionStats[]
  descriptives: DescriptiveRow[]
}