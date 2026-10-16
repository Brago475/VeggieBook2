import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BookSummary, NewSecretsBook, Secret, SecretCategory } from '../types'
import {
  clearSavedSecretsFlow,
  loadSavedSecretsFlow,
  saveSecretsFlow,
} from '../utils/secretsFlowStorage'
import { useCategorySecrets } from './useSecrets'

// The steps of making one Secrets Book, the Secrets counterpart of useBookFlow:
//
//   pick        choose one of the five categories
//   who         Who Says So?, a side trip from pick; back returns there
//   transition  "We are getting Breakfast Secrets", then NEXT
//   review      KEEP / DROP, one secret at a time
//   none        every secret was dropped: review again, or pick another
//   copies      extra printed copies
//   cover       the first kept secret's picture, any secret's picture, or an upload
//
// The category's secrets start loading as soon as it is picked. For a
// signed-in user the book in progress is kept in the tab's storage; for a
// guest nothing is kept.

export type SecretsStep =
  | 'pick'
  | 'who'
  | 'transition'
  | 'review'
  | 'none'
  | 'copies'
  | 'cover'

export type SecretsFlowState = ReturnType<typeof useSecretsFlow>

// Ids for a guest's books, which exist only on this page.
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useSecretsFlow(owner: string | null) {
  const [step, setStep] = useState<SecretsStep>('pick')
  const [category, setCategory] = useState<SecretCategory | null>(null)
  // The chosen category's secrets; reloaded for a restored category after a refresh.
  const secrets = useCategorySecrets(category?.id ?? null)

  // Where the user is in KEEP / DROP, and what they have kept so far.
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewKept, setReviewKept] = useState<Secret[]>([])
  // The final kept secrets, once the review is done.
  const [kept, setKept] = useState<Secret[]>([])
  // Secrets checked for an extra printed copy.
  const [extraCopies, setExtraCopies] = useState<number[]>([])

  // Restore a saved book once, when the signed-in user is known, and only into an empty flow.
  const restoredFor = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (!owner || restoredFor.current === owner) return
    restoredFor.current = owner
    if (step !== 'pick' || category !== null) return

    const saved = loadSavedSecretsFlow(owner)
    if (!saved) return

    setStep(saved.step)
    setCategory(saved.category)
    setReviewIndex(saved.reviewIndex)
    setReviewKept(saved.reviewKept)
    setKept(saved.kept)
    setExtraCopies(saved.extraCopies)
    // Runs only when the signed-in user changes; the rest is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner])

  // Save after every change, for a signed-in user only. An empty flow clears what was saved.
  useEffect(() => {
    if (!owner) return
    if (!category) {
      clearSavedSecretsFlow()
      return
    }
    saveSecretsFlow({
      owner,
      step,
      category,
      reviewIndex,
      reviewKept,
      kept,
      extraCopies,
    })
  }, [owner, step, category, reviewIndex, reviewKept, kept, extraCopies])

  // "Use default cover": the first kept secret that has a picture.
  const defaultCover = kept.map((s) => s.image).find((image) => Boolean(image)) ?? null

  function clearReview() {
    setReviewIndex(0)
    setReviewKept([])
    setKept([])
    setExtraCopies([])
  }

  // Clears everything for a new Secrets Book. Also called after saving and on sign out.
  function start() {
    clearReview()
    setCategory(null)
    setStep('pick')
    clearSavedSecretsFlow()
  }

  // Choosing a category starts its review over and shows the transition while it loads.
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

  // KEEP or DROP on the current secret. After the last one, the kept secrets
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

  // Back button per step, matching the VeggieBook flow.
  function backAction(leave: () => void): (() => void) | undefined {
    if (step === 'pick') return leave
    if (step === 'who' || step === 'transition' || step === 'none') {
      return chooseAnother
    }
    return undefined
  }

  // The finished book in the shape POST /api/books/secrets expects. Dropped
  // secrets are the ones shown in the review but not kept, recorded for research.
  function buildBook(cover: string): NewSecretsBook | null {
    if (!category || kept.length === 0) return null
    const copies = new Set(extraCopies)
    const keptIds = new Set(kept.map((s) => s.id))
    const dropped = (secrets.data?.secrets ?? [])
      .map((s) => s.id)
      .filter((id) => !keptIds.has(id))
    return {
      categoryId: category.id,
      secrets: kept.map((s) => ({ id: s.id, extraCopies: copies.has(s.id) ? 1 : 0 })),
      dropped,
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