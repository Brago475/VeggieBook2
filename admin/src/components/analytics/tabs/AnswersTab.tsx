import type { AnalyticsData } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { QuestionExplorer } from '../QuestionExplorer'
import { TopAnswers } from '../TopAnswers'

// How people answered the VeggieBook questions.
//
// Hidden questions are left out. The original app never showed them on
// screen and set them itself, so no one can answer them.

type Props = {
  data: AnalyticsData
}

export function AnswersTab({ data }: Props) {
  const questions = data.questions.filter((q) => !q.hidden)

  return (
    <>
      <Panel title="Answers by question">
        <QuestionExplorer questions={questions} />
      </Panel>

      <Panel title="Most picked answers">
        <TopAnswers questions={questions} />
      </Panel>
    </>
  )
}