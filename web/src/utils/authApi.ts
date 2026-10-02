import { apiFetch } from './api'

// Account requests that do not change who is signed in on this page.
// The ones that do (sign in, sign out, guest, and so on) live in
// hooks/useAuth.ts, which keeps the page's state in step with them.
//
// Forgot password, without email (see api/Auth/RecoveryController.cs):
//   1. The PIN, 3 tries a day.
//   2. The security question, 3 tries a day. Then password reset locks.
// A right PIN or answer gives a ticket, which finishes the reset once.

export type RecoveryQuestion = { id: number; text: string }

export type RecoverySettings = {
  hasPin: boolean
  questionId: number | null
  question: string | null
}

// A new PIN, question, and answer, as the API takes them.
export type NewRecovery = { pin: string; questionId: number; answer: string }

type Ticket = { ticket: string }

export function getRecoveryQuestions() {
  return apiFetch<RecoveryQuestion[]>('/auth/recovery/questions')
}

// For an email without an account, the API answers with a made-up question,
// so this never reveals who has an account.
export function getQuestionFor(email: string) {
  return apiFetch<RecoveryQuestion>('/auth/recovery/question', {
    method: 'POST',
    body: { email },
  })
}

export async function checkRecoveryPin(email: string, pin: string) {
  const res = await apiFetch<Ticket>('/auth/recovery/pin', {
    method: 'POST',
    body: { email, pin },
  })
  return res.ticket
}

export async function checkRecoveryAnswer(email: string, answer: string) {
  const res = await apiFetch<Ticket>('/auth/recovery/answer', {
    method: 'POST',
    body: { email, answer },
  })
  return res.ticket
}

export function finishPasswordReset(
  email: string,
  ticket: string,
  newPassword: string,
  recovery: NewRecovery,
) {
  return apiFetch<void>('/auth/recovery/reset', {
    method: 'POST',
    body: {
      email,
      ticket,
      newPassword,
      newPin: recovery.pin,
      questionId: recovery.questionId,
      answer: recovery.answer,
    },
  })
}

export function getRecoverySettings() {
  return apiFetch<RecoverySettings>('/auth/recovery/settings')
}

export function saveRecoverySettings(currentPassword: string, recovery: NewRecovery) {
  return apiFetch<void>('/auth/recovery/settings', {
    method: 'PUT',
    body: {
      currentPassword,
      pin: recovery.pin,
      questionId: recovery.questionId,
      answer: recovery.answer,
    },
  })
}