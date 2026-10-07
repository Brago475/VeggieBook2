import type { AnalyticsData } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { QuestionExplorer } from '../QuestionExplorer'
import { TopAnswers } from '../TopAnswers'

// How people answered the VeggieBook questions.
//
// Hidden questions are left out. The original app never showed them on
// screen and set them itself, so no one can answer them and they would
// always show 0.

type Props = {
  data: AnalyticsData
}

export function AnswersTab({ data }: Props) {
  const questions = data.questions.filter((q) => !q.hidden)

  return (
    <>
      <Panel icon="chat" title="Answers by question" description="Pick a question to see how people answered.">
        <QuestionExplorer questions={questions} />
      </Panel>

      <Panel icon="chart" title="Most picked answers" description="Across every question.">
        <TopAnswers questions={questions} />
      </Panel>
    </>
  )
}