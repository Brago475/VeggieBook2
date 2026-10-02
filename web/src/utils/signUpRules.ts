// The Create Account rules, the same ones the API enforces
// (api/Auth/SignUpRules.cs). Checked here first so people hear about a
// problem right away.

// Everyone must be 18 or older, so there is no range under 18.
export const AGE_RANGES: { value: string; label: string }[] = [
  { value: '18-24', label: '18 to 24' },
  { value: '25-34', label: '25 to 34' },
  { value: '35-44', label: '35 to 44' },
  { value: '45-54', label: '45 to 54' },
  { value: '55-64', label: '55 to 64' },
  { value: '65+', label: '65 and older' },
]

export function checkName(value: string, label: string): string | null {
  const name = value.trim()
  if (!name) return `Please enter your ${label}.`
  if (name.length > 50) return `Your ${label} must be at most 50 characters.`
  if (!/^[\p{L} .'-]+$/u.test(name))
    return `Your ${label} can only use letters, spaces, hyphens, and apostrophes.`
  return null
}

// The username is optional. Left blank, the API makes one up.
export function checkUsername(value: string): string | null {
  const name = value.trim()
  if (!name) return null
  if (name.length < 3 || name.length > 20) return 'Your username must be 3 to 20 characters.'
  if (!/^[A-Za-z0-9_]+$/.test(name))
    return 'Your username can only use letters, numbers, and underscores.'
  return null
}