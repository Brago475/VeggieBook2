import { useState } from 'react'
import type { BookSummary, NewSecretsBook, Secret, SecretCategory } from '../types'
import { useCategorySecrets } from './useSecrets'

// The steps of making one Secrets Book, from choosing a category to
// choosing its cover. The Secrets counterpart of useBookFlow, and simpler:
// a Secrets Book has no questions. The user picks a category and keeps or
// drops each of its secrets, as in the original app.
//
//   pick        choose one of the five categories
//   who         Who Says So?, a side trip from pick; back returns there
//   transition  "We are getting Breakfast Secrets", then NEXT
//   review      KEEP / DROP, one secret at a time
//   none        every secret was dropped: review again, or pick another
//   copies      extra printed copies
//   cover       the book's cover: the first kept secret's picture, any
//               secret's picture from any category, or an upload
//
// The category's secrets start loading the moment it is picked, so they
// are usually ready by the time NEXT is pressed on the transition, the
// same as the VeggieBook flow's recipe match.
//
// Not yet kept through a refresh, as the VeggieBook flow is. That comes
// once the whole flow works; until then a refresh starts over.

export type SecretsStep =
  | 'pick'
  | 'who'
  | 'transition'
  | 'review'
  | 'none'
  | 'copies'
  | 'cover'

export type SecretsFlowState = ReturnType<typeof useSecretsFlow>

// Ids for a guest's books, which exist only on this page. The same as
// useBookFlow's.
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useSecretsFlow() {
  const [step, setStep] = useState<SecretsStep>('pick')
  const [category, setCategory] = useState<SecretCategory | null>(null)
  // Loads the chosen category's secrets; nothing while none is chosen.
  const secrets = useCategorySecrets(category?.id ?? null)

  // Where the user is in KEEP / DROP, and what they have kept so far.
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewKept, setReviewKept] = useState<Secret[]>([])
  // The final kept secrets, once the review is done.
  const [kept, setKept] = useState<Secret[]>([])
  // Secrets checked for an extra printed copy.
  const [extraCopies, setExtraCopies] = useState<number[]>([])

  // "Use default cover": the first kept secret that has a picture.
  const defaultCover = kept.map((s) => s.image).find((image) => Boolean(image)) ?? null

  function clearReview() {
    setReviewIndex(0)
    setReviewKept([])
    setKept([])
    setExtraCopies([])
  }

  // Clears everything for a new Secrets Book. Also called once a book is
  // saved, and on sign out.
  function start() {
    clearReview()
    setCategory(null)
    setStep('pick')
  }

  // Choosing a category starts its review over, and shows the transition
  // while its secrets load. Choosing a different one after backing out
  // never carries the last one's choices over.
  function chooseCategory(next: SecretCategory) {
    clearReview()
    setCategory(next)
    setStep('transition')
  }

  function showWhoSaysSo() {
    setStep('who')
  }

  // NEXT on the transition.
  function toReview() {
    clearReview()
    setStep('review')
  }

  // KEEP or DROP on the current secret. Both move on; they differ only in
  // whether the secret is recorded. After the last one, the kept secrets
  // become the book, or, if none was kept, the none step offers a way on.
  function decide(keep: boolean) {
    const list = secrets.data?.secrets ?? []
    const secret = list[reviewIndex]
    if (!secret) return

    const nextKept = keep ? [...reviewKept, secret] : reviewKept
    setReviewKept(nextKept)

    if (reviewIndex < list.length - 1) {
      setReviewIndex(reviewIndex + 1)
      return
    }

    setKept(nextKept)
    setExtraCopies([])
    setStep(nextKept.length === 0 ? 'none' : 'copies')
  }

  // From the none step: the same category again, from its first secret.
  function reviewAgain() {
    clearReview()
    setStep('review')
  }

  // From the none step: back to the five categories.
  function chooseAnother() {
    clearReview()
    setCategory(null)
    setStep('pick')
  }

  function toggleCopy(id: number) {
    setExtraCopies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function finishCopies() {
    setStep('cover')
  }

  // What the back button does on the current step. Matches the VeggieBook
  // flow: review, copies, and cover have none, because going back would
  // lose the choices made there. On the first step, back leaves the flow;
  // every step before the review goes back to the picker.
  function backAction(leave: () => void): (() => void) | undefined {
    if (step === 'pick') return leave
    if (step === 'who' || step === 'transition' || step === 'none') {
      return chooseAnother
    }
    return undefined
  }

  // The finished book in the shape POST /api/books/secrets expects. An
  // upload is a data URL; anything else is a secret's picture, the same
  // test the VeggieBook flow uses.
  function buildBook(cover: string): NewSecretsBook | null {
    if (!category || kept.length === 0) return null
    const copies = new Set(extraCopies)
    return {
      categoryId: category.id,
      secrets: kept.map((s) => ({ id: s.id, extraCopies: copies.has(s.id) ? 1 : 0 })),
      ...(cover.startsWith('data:') ? { coverUpload: cover } : { coverPath: cover }),
    }
  }

  // A guest's finished book, for the home screen. Never sent anywhere.
  function guestSummary(cover: string): BookSummary | null {
    if (!category || kept.length === 0) return null
    return {
      id: newId(),
      kind: 'secrets',
      vegetableCode: null,
      secretCategoryId: category.id,
      cover,
      recipeCount: kept.length,
      createdAt: new Date().toISOString(),
    }
  }

  return {
    step,
    category,
    secrets,
    reviewIndex,
    kept,
    extraCopies,
    defaultCover,
    start,
    chooseCategory,
    showWhoSaysSo,
    toReview,
    decide,
    reviewAgain,
    chooseAnother,
    toggleCopy,
    finishCopies,
    backAction,
    buildBook,
    guestSummary,
  }
}