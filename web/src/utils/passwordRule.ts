// The password rule, the same one the API enforces (api/Auth/AuthHelpers.cs).
// Checked here so people hear about it right away; the API checks it again.

export const MIN_PASSWORD = 8

export const PASSWORD_HINT =
  'At least 8 characters, with an uppercase letter, a lowercase letter, and a special character like ! or #.'

const RULE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a special character.'

export function checkPassword(password: string): string | null {
  if (
    password.length < MIN_PASSWORD ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return RULE
  }
  if (password.length > 128) return 'Password must be at most 128 characters.'
  return null
}