import type { BookFlowState } from '../hooks/useBookFlow'
import type { Question, Vegetable } from '../types'
import { CoverChooser } from './CoverChooser'
import { ExtraCopies } from './ExtraCopies'
import { QuestionScreen } from './QuestionScreen'
import { RecipeReview } from './RecipeReview'
import { Transition } from './Transition'
import { VegetablePicker } from './VegetablePicker'

// Shows the current step of making a book. The steps and everything chosen
// along the way live in hooks/useBookFlow.ts; this only picks the screen.

type Props = {
  flow: BookFlowState
  vegetables: Vegetable[]
  questions: Question[]
  loading: boolean
  signedIn: boolean
  onSave: (cover: string) => Promise<void>
  onCreateAccount: (cover: string) => void
  onFinishWithoutSaving: (cover: string) => void
}

export function BookFlow({
  flow,
  vegetables,
  questions,
  loading,
  signedIn,
  onSave,
  onCreateAccount,
  onFinishWithoutSaving,
}: Props) {
  const { step, vegetable, match } = flow

  if (step === 'pick') {
    return (
      <VegetablePicker
        vegetables={vegetables}
        loading={loading}
        onSelect={flow.chooseVegetable}
      />
    )
  }

  if (!vegetable) return null

  if (step === 'quiz') {
    const question = questions[flow.questionIndex]
    if (!question) return null
    return (
      <QuestionScreen
        vegetable={vegetable}
        question={question}
        picked={flow.picked}
        onToggle={flow.toggle}
        onNext={flow.nextQuestion}
      />
    )
  }

  if (step === 'transition') return <Transition onNext={flow.toReview} />

  if (step === 'review') {
    return (
      <>
        {match.running && <p className="message">Loading recipes...</p>}
        {match.error && <p className="message">Match failed: {match.error}</p>}
        {match.result && (
          <RecipeReview recipes={match.result.recipes} onFinish={flow.finishReview} />
        )}
      </>
    )
  }

  if (step === 'copies') {
    return <ExtraCopies recipes={flow.kept} onNext={flow.finishCopies} />
  }

  return (
    <CoverChooser
      vegetable={vegetable}
      vegetables={vegetables}
      signedIn={signedIn}
      onSave={onSave}
      onCreateAccount={onCreateAccount}
      onFinishWithoutSaving={onFinishWithoutSaving}
    />
  )
}