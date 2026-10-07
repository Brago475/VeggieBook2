import type { AnalyticsData } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { QuestionExplorer } from '../QuestionExplorer'
import { TopAnswers } from '../TopAnswers'

// How people answered the VeggieBook questions.

type Props = {
  data: AnalyticsData
}

export function AnswersTab({ data }: Props) {
  return (
    <>
      <Panel
        title="Answers by question"
        description="Pick a question to see how often each answer was chosen."
      >
        <QuestionExplorer questions={data.questions} totalBooks={data.summary.veggieBooks} />
      </Panel>

      <Panel
        title="Most picked answers overall"
        description="The 10 answers chosen most often, across every question."
      >
        <TopAnswers questions={data.questions} />
      </Panel>
    </>
  )
}