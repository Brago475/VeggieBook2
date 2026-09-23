import type { FlowStep } from '../hooks/useBookFlow'
import type { MatchResult, RecipeSummary, Vegetable } from '../types'

// Keeps a signed-in user's book in progress in this tab's sessionStorage,
// so a refresh picks up at the same step instead of starting over.
//
// sessionStorage, not localStorage: it belongs to this tab only and is
// gone when the tab closes. Guests are never saved here; their rule is
// that nothing about them is kept.
//
// The saved book names its owner (the signed-in email). Restoring checks
// it, so if someone else signs in on the same tab they never see another
// person's book in progress.
//
// Every access is wrapped: private browsing or full storage throws, and a
// book in progress is a convenience, never worth an error on screen.
//
// The chosen cover is not kept. An uploaded photo can be several hundred
// KB, too much to hold here reliably, and choosing again is one tap.

const KEY = 'veggiebook.flow'
const VERSION = 1

export type SavedFlow = {
  v: number
  owner: string
  step: FlowStep
  vegetable: Vegetable
  questionIndex: number
  picked: string[]
  matchResult: MatchResult | null
  reviewIndex: number
  reviewKept: RecipeSummary[]
  kept: RecipeSummary[]
  extraCopies: number[]
}

export function loadSavedFlow(owner: string): SavedFlow | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SavedFlow
    if (data.v !== VERSION || data.owner !== owner || !data.vegetable) return null
    return data
  } catch {
    return null
  }
}

export function saveFlow(data: Omit<SavedFlow, 'v'>) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ v: VERSION, ...data }))
  } catch {
    // Nothing to do: the book simply will not survive a refresh.
  }
}

export function clearSavedFlow() {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // Same as above.
  }
}