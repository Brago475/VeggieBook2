import type { NewRecovery } from './authApi'

// The recovery PIN and security question, as typed into a form. The same
// rules as the API (api/Auth/AccountRecovery.cs), checked here first.

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

export function checkRecovery(value: RecoveryValue): string | null {
  if (!/^\d{6}$/.test(value.pin)) return 'Your PIN must be exactly 6 digits.'
  if (isEasyPin(value.pin)) return 'That PIN is too easy to guess. Please pick another one.'
  if (value.pin !== value.pinAgain) return 'The two PINs do not match.'
  if (!value.questionId) return 'Please choose a security question.'
  const answer = value.answer.trim()
  if (!answer) return 'Please answer your security question.'
  if (answer.length > MAX_ANSWER) return `Your answer must be at most ${MAX_ANSWER} characters.`
  return null
}

export function toNewRecovery(value: RecoveryValue): NewRecovery {
  return {
    pin: value.pin,
    questionId: Number(value.questionId),
    answer: value.answer.trim(),
  }
}