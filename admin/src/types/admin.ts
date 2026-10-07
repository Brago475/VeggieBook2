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
export type Overview = {
  accounts: number
  newAccountsThisWeek: number
  recoveryLocked: number
  activeGuests: number
  veggieBooks: number
  secretsBooks: number
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