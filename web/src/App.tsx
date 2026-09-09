import { useState } from 'react'
import { Masthead } from './components/Masthead'
import { useVeggieBookData } from './hooks/useVeggieBookData'
import { QuestionScreen } from './pages/QuestionScreen'
import { VegetablePicker } from './pages/VegetablePicker'
import type { Vegetable } from './types'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/pages.css'

// Flow state lives here; each screen is a page component.
//
//   no vegetable          -> picker
//   vegetable + question  -> question screen
//   vegetable, no more    -> temporary summary, becomes the recipe review

export default function App() {
  const { vegetables, questions, error, loading } = useVeggieBookData()

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

  function restart() {
    setVegetable(null)
    setStep(0)
    setPicked(new Set())
  }

  const question = questions[step]

  return (
    <div className="app">
           <Masthead
        onBack={
          !vegetable
            ? undefined
            : step === 0
              ? restart
              : () => setStep(step - 1)
        }
      />

      {error && <p className="message">Could not load: {error}</p>}

      {!vegetable && (
        <VegetablePicker
          vegetables={vegetables}
          loading={loading}
          onSelect={setVegetable}
        />
      )}

      {vegetable && question && (
        <QuestionScreen
          vegetable={vegetable}
          question={question}
          isLast={step === questions.length - 1}
          picked={picked}
          onToggle={toggle}
          onNext={() => setStep(step + 1)}
        />
      )}

      {vegetable && !question && questions.length > 0 && (
        <>
          <p className="message">
            Selected attributes: {[...picked].join(', ') || 'none'}
          </p>
          <button type="button" className="nav-btn" onClick={restart}>
            Start over
          </button>
        </>
      )}
    </div>
  )
}
