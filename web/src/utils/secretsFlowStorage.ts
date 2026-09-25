import type { SecretsStep } from '../hooks/useSecretsFlow'
import type { Secret, SecretCategory } from '../types'

// Keeps a signed-in user's Secrets Book in progress in this tab's
// sessionStorage, so a refresh picks up at the same step instead of
// starting over. The Secrets counterpart of flowStorage.ts, with the same
// rules:
//
//   sessionStorage, not localStorage: it belongs to this tab only and is
//   gone when the tab closes.
//
//   Guests are never saved here; their rule is that nothing about them is
//   kept.
//
//   The saved book names its owner (the signed-in email). Restoring checks
//   it, so if someone else signs in on the same tab they never see another
//   person's book in progress.
//
//   Every access is wrapped: private browsing or full storage throws, and a
//   book in progress is a convenience, never worth an error on screen.
//
//   The chosen cover is not kept. An uploaded photo can be several hundred
//   KB, too much to hold here reliably, and choosing again is one tap.
//
// Its own key, so a VeggieBook and a Secrets Book in progress in the same
// tab never overwrite each other.
//
// The category's secrets are not kept either: they are loaded again from
// the API on restore, since they are the same for everyone. Only what the
// user chose is kept.

const KEY = 'veggiebook.secretsFlow'
const VERSION = 1

export type SavedSecretsFlow = {
  v: number
  owner: string
  step: SecretsStep
  category: SecretCategory
  reviewIndex: number
  reviewKept: Secret[]
  kept: Secret[]
  extraCopies: number[]
}

export function loadSavedSecretsFlow(owner: string): SavedSecretsFlow | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SavedSecretsFlow
    if (data.v !== VERSION || data.owner !== owner || !data.category) return null
    return data
  } catch {
    return null
  }
}

export function saveSecretsFlow(data: Omit<SavedSecretsFlow, 'v'>) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ v: VERSION, ...data }))
  } catch {
    // Nothing to do: the book simply will not survive a refresh.
  }
}

export function clearSavedSecretsFlow() {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // Same as above.
  }
}