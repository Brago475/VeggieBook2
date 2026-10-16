import type { Lang } from '../i18n/language'
import { RULES } from '../i18n/strings/rules'
import type { NewRecovery } from './authApi'

// The recovery PIN and security question, as typed into a form. The same
// rules as the API (api/Auth/AccountRecovery.cs), checked here first.
// Messages come in the language passed in, English by default.

export type RecoveryValue = {
  pin: string
  pinAgain: string
  questionId: string
  answer: string
}

export const EMPTY_RECOVERY: RecoveryValue = {
  pin: '',
  pinAgain: '',
  questionId: '',
  answer: '',
}

export const MAX_ANSWER = 100

function isEasyPin(pin: string) {
  return new Set(pin).size === 1 || '0123456789'.includes(pin) || '9876543210'.includes(pin)
}

export function checkRecovery(value: RecoveryValue, lang: Lang = 'en'): string | null {
  const t = RULES[lang]
  if (!/^\d{6}$/.test(value.pin)) return t.pinDigits
  if (isEasyPin(value.pin)) return t.pinEasy
  if (value.pin !== value.pinAgain) return t.pinsDiffer
  if (!value.questionId) return t.chooseQuestion
  const answer = value.answer.trim()
  if (!answer) return t.answerEmpty
  if (answer.length > MAX_ANSWER) return t.answerTooLong(MAX_ANSWER)
  return null
}

export function toNewRecovery(value: RecoveryValue): NewRecovery {
  return {
    pin: value.pin,
    questionId: Number(value.questionId),
    answer: value.answer.trim(),
  }
}