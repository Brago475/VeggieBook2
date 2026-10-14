import type { Lang } from '../i18n/language'
import { RULES } from '../i18n/strings/rules'

// The Create Account rules, the same ones the API enforces
// (api/Auth/SignUpRules.cs). Checked here first so people hear about a
// problem right away. Messages come in the language passed in, English by
// default.

const AGE_VALUES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']

// Everyone must be 18 or older, so there is no range under 18. The values
// are stored; only the labels change with the language.
export function ageRanges(lang: Lang = 'en'): { value: string; label: string }[] {
  return AGE_VALUES.map((value, i) => ({ value, label: RULES[lang].ages[i] }))
}

export const AGE_RANGES = ageRanges('en')

export function checkName(
  value: string,
  label: 'first name' | 'last name',
  lang: Lang = 'en',
): string | null {
  const t = RULES[lang]
  const name = value.trim()
  if (!name) return t.nameEmpty(label)
  if (name.length > 50) return t.nameTooLong(label)
  if (!/^[\p{L} .'-]+$/u.test(name)) return t.nameChars(label)
  return null
}

// The username is optional. Left blank, the API makes one up.
export function checkUsername(value: string, lang: Lang = 'en'): string | null {
  const t = RULES[lang]
  const name = value.trim()
  if (!name) return null
  if (name.length < 3 || name.length > 20) return t.usernameLength
  if (!/^[A-Za-z0-9_]+$/.test(name)) return t.usernameChars
  return null
}