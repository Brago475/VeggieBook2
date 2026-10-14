// Shapes of what the Settings routes send (api/Admin/AdminSettingsController.cs
// and AdminAccountsController.cs). Dates are ISO strings (UTC).

export type AccountFilter = 'all' | 'reset' | 'signin'

export type AccountRow = {
  id: string
  email: string
  username: string | null
  isAdmin: boolean
  isRootAdmin: boolean
  createdAt: string
  bookCount: number
  recoveryLocked: boolean
  signInLocked: boolean
}

export type AccountSearchResponse = {
  results: AccountRow[]
  limit: number
  total: number
}

export type AccountDetail = {
  id: string
  email: string
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

export type AdminRow = {
  id: string
  email: string
  username: string | null
  createdAt: string
  isRoot: boolean
  isYou: boolean
}

export type IdentityRow = {
  id: string
  email: string
  username: string | null
  createdAt: string
  isAdmin: boolean
}

export type IdentityHistoryEntry = {
  at: string
  action: 'identity_opened' | 'research_id_revealed'
  adminEmail: string
  targetEmail: string | null
  targetDeleted: boolean
}

export type IdentityHistoryResponse = {
  limit: number
  entries: IdentityHistoryEntry[]
}

export type SiteSettingsInfo = {
  me: { email: string; isRoot: boolean }
  accounts: { total: number; newThisWeek: number; resetLocked: number; signInLocked: number }
  guests: {
    allowed: boolean
    today: number
    last7: number
    insideNow: number
    lifetimeHours: number
    daily: { day: string; visits: number }[]
  }
  research: { termsVersion: string; termsAccepted: number; accounts: number }
  system: {
    database: boolean
    study: { number: number; name: string | null } | null
    lastBookAt: string | null
  }
}