// Shapes of what the API sends the admin site. They match the anonymous
// objects returned by api/Auth/AuthController.cs and api/Admin/*.cs.
// If an endpoint's response changes, change its type here to match.

// GET /api/auth/me
export type Me = {
  email: string | null
  roles: string[]
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