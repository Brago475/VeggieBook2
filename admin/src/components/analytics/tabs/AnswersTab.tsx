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
      <Panel icon="question" title="Answers by question">
        <QuestionExplorer questions={data.questions} />
      </Panel>

      <Panel icon="chart" title="Most picked answers">
        <TopAnswers questions={data.questions} />
      </Panel>
    </>
  )
}