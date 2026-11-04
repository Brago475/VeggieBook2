import type { Lang } from '../i18n/language'
import { RULES } from '../i18n/strings/rules'

// The password rule, the same one the API enforces (api/Auth/AuthHelpers.cs).
// Checked here so people hear about it right away; the API checks it again.
// Messages come in the language passed in, English by default.
//
// Letters in any language count as uppercase or lowercase (Ñ, é). A special
// character is anything that is not a letter or a digit. These match .NET's
// char.IsUpper, char.IsLower and char.IsLetterOrDigit on the server.

export const MIN_PASSWORD = 8

const UPPER = /\p{Lu}/u
const LOWER = /\p{Ll}/u
const SPECIAL = /[^\p{L}\p{Nd}]/u

export function passwordHint(lang: Lang = 'en'): string {
  return RULES[lang].passwordHint
}

export const PASSWORD_HINT = passwordHint('en')

export function checkPassword(password: string, lang: Lang = 'en'): string | null {
  const t = RULES[lang]
  if (
    password.length < MIN_PASSWORD ||
    !UPPER.test(password) ||
    !LOWER.test(password) ||
    !SPECIAL.test(password)
  ) {
    return t.passwordRule
  }
  if (password.length > 128) return t.passwordTooLong
  return null
}