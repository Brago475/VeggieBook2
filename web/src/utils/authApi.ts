import { apiFetch } from './api'

// Account requests that do not change who is signed in on this page.
// The ones that do (sign in, sign out, guest, and so on) live in
// hooks/useAuth.ts, which keeps the page's state in step with them.
//
// The API answers forgot-password the same way whether or not the email has
// an account, so it never reveals who is signed up.

export async function requestPasswordReset(email: string) {
  await apiFetch<{ status: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export function resetPassword(userId: string, token: string, newPassword: string) {
  return apiFetch<void>('/auth/reset-password', {
    method: 'POST',
    body: { userId, token, newPassword },
  })
}