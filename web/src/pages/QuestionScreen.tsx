import { ChoiceRow } from '../components/ChoiceRow'
import { NavBar } from '../components/NavBar'
import { QuestionHero } from '../components/QuestionHero'
import type { Question, Vegetable } from '../types'

// Question text contains %s where the vegetable name belongs. The original
// app wrote it lowercase mid-sentence ("recipes for zucchini that use..")
// rather than title case, so fillName lowercases it.

function fillName(text: string, name: string) {
  return text.replace(/%s/g, name.toLowerCase())
}

type Props = {
  vegetable: Vegetable
  question: Question
  picked: Set<string>
  onToggle: (attribute: string) => void
  onNext: () => void
}

export function QuestionScreen({
  vegetable,
  question,
  picked,
  onToggle,
  onNext,
}: Props) {
  return (
    <>
      <QuestionHero vegetable={vegetable} />

      <div className="question">
        <h2 className="question-intro">
          {fillName(question.intro, vegetable.name)}
        </h2>
        {question.subIntro && (
          <p className="question-sub">{question.subIntro.toUpperCase()}</p>
        )}

        <ul>
          {question.choices.map((choice) => (
            <li key={choice.id}>
              <ChoiceRow
                label={fillName(choice.text, vegetable.name)}
                checked={picked.has(choice.attribute)}
                onToggle={() => onToggle(choice.attribute)}
              />
            </li>
          ))}
        </ul>
      </div>

      <NavBar
                primaryLabel="NEXT"
        onPrimary={onNext}
      />
    </>
  )
}