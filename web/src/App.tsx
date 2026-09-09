import { useState } from 'react'
import { Masthead } from './components/Masthead'
import { useSavedBooks } from './hooks/useSavedBooks'
import { useVeggieBookData } from './hooks/useVeggieBookData'
import { HomeLibrary } from './pages/HomeLibrary'
import { QuestionScreen } from './pages/QuestionScreen'
import { VegetablePicker } from './pages/VegetablePicker'
import type { Vegetable } from './types'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/pages.css'

// Flow state lives here; each screen is a page component.
//
//   home    -> saved books plus the two create buttons
//   pick    -> choose a vegetable
//   quiz    -> five questions, one per screen
//   done    -> temporary summary, becomes the recipe review

type Screen = 'home' | 'pick' | 'quiz'

export default function App() {
  const { vegetables, questions, error, loading } = useVeggieBookData()
  const { books } = useSavedBooks()

  const [screen, setScreen] = useState<Screen>('home')
  const [vegetable, setVegetable] = useState<Vegetable | null>(null)
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<Set<string>>(new Set())

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
  }

  function chooseVegetable(veg: Vegetable) {
    setVegetable(veg)
    setStep(0)
    setScreen('quiz')
  }

  const question = questions[step]

  // The back arrow means something different on each screen, so it is
  // resolved here rather than inside Masthead.
  function backAction() {
    if (screen === 'pick') return goHome
    if (screen === 'quiz') {
      return step === 0 ? () => setScreen('pick') : () => setStep(step - 1)
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
          isLast={step === questions.length - 1}
          picked={picked}
          onToggle={toggle}
          onNext={() => setStep(step + 1)}
        />
      )}

      {screen === 'quiz' && vegetable && !question && (
        <>
          <p className="message">
            Selected attributes: {[...picked].join(', ') || 'none'}
          </p>
          <div className="nav">
            <button type="button" className="nav-btn" onClick={goHome}>
              Start over
            </button>
          </div>
        </>
      )}
    </div>
  )
}