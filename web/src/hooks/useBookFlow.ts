import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BookSummary, NewBook, RecipeSummary, Vegetable } from '../types'
import { clearSavedFlow, loadSavedFlow, saveFlow } from '../utils/flowStorage'
import { useMatch } from './useMatch'

// The steps of making one VeggieBook, from choosing a vegetable to choosing
// its cover. Holds everything the user picks along the way, so App only
// decides what happens once the book is finished: saved to an account, or
// kept on the page for a guest.
//
// Everything lives here, including the place in the KEEP / DROP review and
// the extra-copy checkmarks, so the whole book in progress can be saved in
// one piece. For a signed-in user (owner is their email) it is kept in the
// tab's storage after every change and restored on load, so a refresh
// picks up where they were. For a guest (owner is null) nothing is kept.

export type FlowStep = 'pick' | 'quiz' | 'transition' | 'review' | 'copies' | 'cover'

export type BookFlowState = ReturnType<typeof useBookFlow>

// Ids for a guest's books, which exist only on this page.
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useBookFlow(questionCount: number, owner: string | null) {
  const match = useMatch()
  const [step, setStep] = useState<FlowStep>('pick')
  const [vegetable, setVegetable] = useState<Vegetable | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  // Where the user is in KEEP / DROP, and what they have kept so far.
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewKept, setReviewKept] = useState<RecipeSummary[]>([])
  // The final kept recipes, once the review is done.
  const [kept, setKept] = useState<RecipeSummary[]>([])
  // Recipes checked for an extra printed copy.
  const [extraCopies, setExtraCopies] = useState<number[]>([])

  // Restore a saved book once, when the signed-in user is known. A layout
  // effect, so the restored step is drawn in the first frame and the
  // vegetable picker never flashes up before it.
  //
  // Only into an empty flow: a guest who has just created an account to
  // save their finished book already has a book here, and it must not be
  // replaced by an older one from storage.
  const restoredFor = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (!owner || restoredFor.current === owner) return
    restoredFor.current = owner
    if (step !== 'pick' || vegetable !== null) return

    const saved = loadSavedFlow(owner)
    if (!saved) return

    setStep(saved.step)
    setVegetable(saved.vegetable)
    setQuestionIndex(saved.questionIndex)
    setPicked(new Set(saved.picked))
    setReviewIndex(saved.reviewIndex)
    setReviewKept(saved.reviewKept)
    setKept(saved.kept)
    setExtraCopies(saved.extraCopies)

    if (saved.matchResult) {
      match.restore(saved.matchResult)
    } else if (saved.step === 'transition' || saved.step === 'review') {
      // Refreshed while the recipes were still being found: ask again.
      void match.run(saved.vegetable.code, saved.picked)
    }
    // Runs only when the signed-in user changes; the rest is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner])

  // Save after every change, for a signed-in user only. An empty flow
  // (nothing chosen yet) clears what was saved.
  useEffect(() => {
    if (!owner) return
    if (!vegetable) {
      clearSavedFlow()
      return
    }
    saveFlow({
      owner,
      step,
      vegetable,
      questionIndex,
      picked: [...picked],
      matchResult: match.result,
      reviewIndex,
      reviewKept,
      kept,
      extraCopies,
    })
  }, [
    owner,
    step,
    vegetable,
    questionIndex,
    picked,
    match.result,
    reviewIndex,
    reviewKept,
    kept,
    extraCopies,
  ])

  // Everything belonging to one book's answers. Used when starting a new
  // book and again whenever a vegetable is chosen, since choosing one
  // begins that book's questions from scratch.
  function clearAnswers() {
    match.reset()
    setQuestionIndex(0)
    setPicked(new Set())
    setReviewIndex(0)
    setReviewKept([])
    setKept([])
    setExtraCopies([])
  }

  // Clears everything for a new book, and whatever was saved for the last
  // one. Also called once a book is saved, and on sign out.
  function start() {
    clearAnswers()
    setStep('pick')
    setVegetable(null)
    clearSavedFlow()
  }

  // Choosing a vegetable starts that book's questions over. Without the
  // clear, backing out to the pick screen and choosing a different
  // vegetable carried the previous answers into the new book.
  function chooseVegetable(veg: Vegetable) {
    clearAnswers()
    setVegetable(veg)
    setStep('quiz')
  }

  function toggle(attribute: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(attribute)) next.delete(attribute)
      else next.add(attribute)
      return next
    })
  }

  // The match runs when leaving the last question, so the results are
  // already in flight while the user reads the transition screen.
  function nextQuestion() {
    if (questionIndex < questionCount - 1) {
      setQuestionIndex(questionIndex + 1)
      return
    }
    if (vegetable) void match.run(vegetable.code, [...picked])
    setStep('transition')
  }

  function toReview() {
    setReviewIndex(0)
    setReviewKept([])
    setStep('review')
  }

  // KEEP or DROP on the current recipe. Both move on; they differ only in
  // whether the recipe is recorded. After the last recipe, the kept ones
  // become the book and the extra-copies step follows.
  function decide(keep: boolean) {
    const recipes = match.result?.recipes ?? []
    const recipe = recipes[reviewIndex]
    if (!recipe) return

    const nextKept = keep ? [...reviewKept, recipe] : reviewKept
    setReviewKept(nextKept)

    if (reviewIndex >= recipes.length - 1) {
      setKept(nextKept)
      setExtraCopies([])
      setStep('copies')
      return
    }
    setReviewIndex(reviewIndex + 1)
  }

  function toggleCopy(id: number) {
    setExtraCopies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function finishCopies() {
    setStep('cover')
  }

  // What the back button does on the current step. Review, copies, and
  // cover have none, because going back would lose the choices made there.
  // On the first step, back leaves the flow.
  function backAction(leave: () => void): (() => void) | undefined {
    if (step === 'pick') return leave
    if (step === 'quiz') {
      return questionIndex === 0
        ? () => setStep('pick')
        : () => setQuestionIndex(questionIndex - 1)
    }
    if (step === 'transition') {
      return () => {
        match.reset()
        setStep('quiz')
      }
    }
    return undefined
  }

  // The finished book in the shape POST /api/books expects.
  function buildBook(cover: string): NewBook | null {
    if (!vegetable) return null
    const copies = new Set(extraCopies)
    return {
      vegetableCode: vegetable.code,
      attributes: [...picked],
      recipes: kept.map((r) => ({ id: r.id, extraCopies: copies.has(r.id) ? 1 : 0 })),
      ...(cover.startsWith('data:') ? { coverUpload: cover } : { coverPath: cover }),
    }
  }

  // A guest's finished book, for the home screen. Never sent anywhere.
  function guestSummary(cover: string): BookSummary | null {
    if (!vegetable) return null
    return {
      id: newId(),
      kind: 'veggie',
      vegetableCode: vegetable.code,
      cover,
      recipeCount: kept.length,
      createdAt: new Date().toISOString(),
    }
  }

  return {
    match,
    step,
    vegetable,
    questionIndex,
    picked,
    reviewIndex,
    kept,
    extraCopies,
    start,
    chooseVegetable,
    toggle,
    nextQuestion,
    toReview,
    decide,
    toggleCopy,
    finishCopies,
    backAction,
    buildBook,
    guestSummary,
  }
}