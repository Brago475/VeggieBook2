import { RecipeSkeleton } from '../components/veggie/RecipeSkeleton'
import type { BookFlowState } from '../hooks/useBookFlow'
import { useHeld } from '../hooks/useHeld'
import { FLOW } from '../i18n/strings/flow'
import { useStrings } from '../i18n/useStrings'
import type { Question, Vegetable } from '../types'
import { CoverChooser } from './CoverChooser'
import { ExtraCopies } from './ExtraCopies'
import { QuestionScreen } from './QuestionScreen'
import { RecipeReview } from './RecipeReview'
import { Transition } from './Transition'
import { VegetablePicker } from './VegetablePicker'

// Shows the current step of making a book. The steps and everything chosen
// along the way, including the place in KEEP / DROP and the extra-copy
// checkmarks, live in hooks/useBookFlow.ts; this only picks the screen.

type Props = {
  flow: BookFlowState
  vegetables: Vegetable[]
  questions: Question[]
  loading: boolean
  onSave: (cover: string) => Promise<void>
}

export function BookFlow({ flow, vegetables, questions, loading, onSave }: Props) {
  const t = useStrings(FLOW)
  const { step, vegetable, match } = flow
  // The review skeleton, held long enough to be seen.
  const matching = useHeld(step === 'review' && match.running)

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
        {/* The recipes are usually ready by the time the transition screen
            is passed; if not, the shape of the first one holds its place. */}
        {matching && <RecipeSkeleton />}
        {!matching && match.error && <p className="message">{t.noRecipes}</p>}
        {!matching && match.result && (
          <RecipeReview
            recipes={match.result.recipes}
            index={flow.reviewIndex}
            onDecide={flow.decide}
          />
        )}
      </>
    )
  }

  if (step === 'copies') {
    return (
      <ExtraCopies
        recipes={flow.kept}
        selected={flow.extraCopies}
        onToggle={flow.toggleCopy}
        onNext={flow.finishCopies}
      />
    )
  }

  return <CoverChooser vegetable={vegetable} vegetables={vegetables} onSave={onSave} />
}