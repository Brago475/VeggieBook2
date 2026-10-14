import type { Lang } from '../i18n/language'
import { RULES } from '../i18n/strings/rules'

// The password rule, the same one the API enforces (api/Auth/AuthHelpers.cs).
// Checked here so people hear about it right away; the API checks it again.
// Messages come in the language passed in, English by default.

export const MIN_PASSWORD = 8

export function passwordHint(lang: Lang = 'en'): string {
  return RULES[lang].passwordHint
}

export const PASSWORD_HINT = passwordHint('en')

export function checkPassword(password: string, lang: Lang = 'en'): string | null {
  const t = RULES[lang]
  if (
    password.length < MIN_PASSWORD ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return t.passwordRule
  }
  if (password.length > 128) return t.passwordTooLong
  return null
}