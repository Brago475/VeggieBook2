// Shapes of what the API sends the admin site. They match the anonymous
// objects returned by api/Auth/AuthController.cs and api/Admin/*.cs.
// If an endpoint's response changes, change its type here to match.
//
// Dates arrive as ISO strings. utils/format.ts turns them into readable text.

// GET /api/auth/me
export type Me = {
  email: string | null
  roles: string[]
}

// GET /api/admin/session
export type AdminSessionInfo = {
  email: string
  isRootAdmin: boolean
}

// GET /api/admin/overview

export type WeekCount = {
  weekStart: string // yyyy-MM-dd, the Monday the week starts on (Eastern)
  veggie: number
  secrets: number
}

export type NameCount = {
  name: string
  count: number
}

export type TopAnswer = {
  answer: string
  question: string // Q1, Q2...
  people: number
  percent: number // of people with at least one VeggieBook
}

// book: a book saved; joined: a new account; book_deleted and
// account_deleted come from the activity log.
export type RecentItem = {
  type: 'book' | 'joined' | 'book_deleted' | 'account_deleted'
  researchId: string
  title: string
  detail: string
  at: string
}

export type Overview = {
  participants: number
  newThisWeek: number // joined in the last 7 days
  veggieBooks: number
  secretsBooks: number
  answersRecorded: number
  recoveryLocked: number
  activeGuests: number
  weekly: WeekCount[] // last 8 weeks, oldest first
  joinedWeekly: number[] // same 8 weeks
  answersWeekly: number[] // same 8 weeks
  byVegetable: NameCount[]
  byCategory: NameCount[]
  ageRanges: NameCount[]
  languages: { english: number; spanish: number }
  covers: { builtin: number; personal: number }
  items: {
    recipesKept: number
    recipesRemoved: number
    secretsKept: number
    secretsRemoved: number
  }
  heat: number[][] // 7 days (Monday first) by 8 three-hour blocks
  topAnswers: TopAnswer[]
  recent: RecentItem[]
}

// GET /api/admin/accounts?q=
export type AccountRow = {
  id: string
  email: string | null
  username: string | null
  isAdmin: boolean
  isRootAdmin: boolean
  createdAt: string
  bookCount: number
  recoveryLocked: boolean
}

export type AccountSearchResult = {
  results: AccountRow[]
  limit: number
}

// GET /api/admin/accounts/{id}
export type AccountInfo = {
  id: string
  email: string | null
  username: string | null
  roles: string[]
  isRootAdmin: boolean
  ageRange: string | null
  createdAt: string
  termsVersion: string | null
  termsAcceptedAt: string | null
  bookCount: number
  recoveryLockedAt: string | null
  signInLockedUntil: string | null
}

// GET /api/admin/accounts/{id}/books
export type BookItem = {
  type: 'recipe' | 'secret'
  id: number
  code: string | null
  title: string
  extraCopies: number
}

export type AdminBook = {
  id: string
  kind: 'veggie' | 'secrets'
  language: string
  createdAt: string
  vegetable: { code: string; name: string } | null
  secretCategory: { id: number; name: string } | null
  // A personal cover is the user's own photo. Its image is never sent to
  // the admin site, only the fact that one exists.
  cover: { type: 'builtin' | 'personal'; path: string | null }
  answers: string[]
  kept: BookItem[]
  removed: BookItem[]
}