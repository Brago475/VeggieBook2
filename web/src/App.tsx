import { useState } from 'react'
import { Masthead } from './components/Masthead'
import { useMatch } from './hooks/useMatch'
import { useSavedBooks } from './hooks/useSavedBooks'
import { useVeggieBookData } from './hooks/useVeggieBookData'
import { CoverChooser } from './pages/CoverChooser'
import { ExtraCopies } from './pages/ExtraCopies'
import { HomeLibrary } from './pages/HomeLibrary'
import { QuestionScreen } from './pages/QuestionScreen'
import { RecipeReview } from './pages/RecipeReview'
import { Transition } from './pages/Transition'
import { VegetablePicker } from './pages/VegetablePicker'
import type { RecipeSummary, SavedBook, Vegetable } from './types'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/pages.css'
import './styles/responsive.css'

// Flow state lives here; each screen is a page component.
//
//   home       -> saved books plus the two create buttons
//   pick       -> choose a vegetable
//   quiz       -> five questions, one per screen
//   transition -> explains KEEP and DROP
//   review     -> the matched recipes, one card at a time
//   copies     -> mark kept recipes for an extra printed copy
//   cover      -> choose the cover, then the book is saved and the user
//                 returns home with it in their library

type Screen =
  | 'home'
  | 'pick'
  | 'quiz'
  | 'transition'
  | 'review'
  | 'copies'
  | 'cover'

// Book ids only need to be unique within this browser. randomUUID is
// missing on plain http pages (for example, testing over a LAN address),
// so there is a fallback.
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function App() {
  const { vegetables, questions, error, loading } = useVeggieBookData()
  const { books, saveBook } = useSavedBooks()
  const match = useMatch()

  const [screen, setScreen] = useState<Screen>('home')
  const [vegetable, setVegetable] = useState<Vegetable | null>(null)
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [kept, setKept] = useState<RecipeSummary[]>([])
  const [extraCopies, setExtraCopies] = useState<number[]>([])

  function toggle(attribute: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(attribute)) next.delete(attribute)
      else next.add(attribute)
      return next
    })
  }

  function goHome() {
    setScreen('home')
    setVegetable(null)
    setStep(0)
    setPicked(new Set())
    setKept([])
    setExtraCopies([])
    match.reset()
  }

  function chooseVegetable(veg: Vegetable) {
    setVegetable(veg)
    setStep(0)
    setScreen('quiz')
  }

  // The match runs when leaving the last question, so the results are
  // already in flight while the user reads the transition screen.
  function advanceQuestion() {
    if (step < questions.length - 1) {
      setStep(step + 1)
      return
    }
    if (vegetable) match.run(vegetable.code, [...picked])
    setScreen('transition')
  }

  // Builds the finished book from everything collected along the way and
  // stores it. Returns false if storage refused it, so the cover screen
  // can tell the user instead of losing the book silently.
  function finishBook(image: string): boolean {
    if (!vegetable) return false

    const book: SavedBook = {
      id: newId(),
      kind: 'veggie',
      title: vegetable.name,
      image,
      vegetableCode: vegetable.code,
      attributes: [...picked],
      recipeIds: kept.map((recipe) => recipe.id),
      extraCopyIds: extraCopies,
      createdAt: new Date().toISOString(),
    }

    if (!saveBook(book)) return false
    goHome()
    return true
  }

  const question = questions[step]

  function backAction() {
    if (screen === 'pick') return goHome
    if (screen === 'quiz') {
      return step === 0 ? () => setScreen('pick') : () => setStep(step - 1)
    }
    if (screen === 'transition') {
      return () => {
        match.reset()
        setScreen('quiz')
      }
    }
    return undefined
  }

  return (
    <div className="app">
      <Masthead onBack={backAction()} />

      {error && <p className="message">Could not load: {error}</p>}

      {screen === 'home' && (
        <HomeLibrary books={books} onCreateVeggie={() => setScreen('pick')} />
      )}

      {screen === 'pick' && (
        <VegetablePicker
          vegetables={vegetables}
          loading={loading}
          onSelect={chooseVegetable}
        />
      )}

      {screen === 'quiz' && vegetable && question && (
        <QuestionScreen
          vegetable={vegetable}
          question={question}
          picked={picked}
          onToggle={toggle}
          onNext={advanceQuestion}
        />
      )}

      {screen === 'transition' && (
        <Transition onNext={() => setScreen('review')} />
      )}

      {screen === 'review' && (
        <>
          {match.running && <p className="message">Loading recipes...</p>}
          {match.error && <p className="message">Match failed: {match.error}</p>}
          {match.result && (
            <RecipeReview
              recipes={match.result.recipes}
              onFinish={(recipes) => {
                setKept(recipes)
                setScreen('copies')
              }}
            />
          )}
        </>
      )}

      {screen === 'copies' && (
        <ExtraCopies
          recipes={kept}
          onNext={(ids) => {
            setExtraCopies(ids)
            setScreen('cover')
          }}
        />
      )}

      {screen === 'cover' && vegetable && (
        <CoverChooser
          vegetable={vegetable}
          vegetables={vegetables}
          onSave={finishBook}
        />
      )}
    </div>
  )
}