import { useState } from 'react'
import type { BookSummary, NewBook, RecipeSummary, Vegetable } from '../types'
import { useMatch } from './useMatch'

// The steps of making one VeggieBook, from choosing a vegetable to choosing
// its cover. Holds everything the user picks along the way, so App only
// decides what happens once the book is finished: saved to an account, or
// kept on the page for a guest.

export type FlowStep = 'pick' | 'quiz' | 'transition' | 'review' | 'copies' | 'cover'

export type BookFlowState = ReturnType<typeof useBookFlow>

// Ids for a guest's books, which exist only on this page.
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useBookFlow(questionCount: number) {
  const match = useMatch()
  const [step, setStep] = useState<FlowStep>('pick')
  const [vegetable, setVegetable] = useState<Vegetable | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [kept, setKept] = useState<RecipeSummary[]>([])
  const [extraCopies, setExtraCopies] = useState<number[]>([])

  // Clears everything for a new book.
  function start() {
    match.reset()
    setStep('pick')
    setVegetable(null)
    setQuestionIndex(0)
    setPicked(new Set())
    setKept([])
    setExtraCopies([])
  }

  function chooseVegetable(veg: Vegetable) {
    setVegetable(veg)
    setQuestionIndex(0)
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
    if (vegetable) match.run(vegetable.code, [...picked])
    setStep('transition')
  }

  function toReview() {
    setStep('review')
  }

  function finishReview(recipes: RecipeSummary[]) {
    setKept(recipes)
    setStep('copies')
  }

  function finishCopies(ids: number[]) {
    setExtraCopies(ids)
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
    kept,
    start,
    chooseVegetable,
    toggle,
    nextQuestion,
    toReview,
    finishReview,
    finishCopies,
    backAction,
    buildBook,
    guestSummary,
  }
}