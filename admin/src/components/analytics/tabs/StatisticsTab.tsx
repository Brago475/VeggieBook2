import type { AnalyticsData } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { DescriptivesTable } from '../DescriptivesTable'

// Descriptive statistics, and how each number on the Analytics screens is
// calculated, so a reader knows exactly what they are looking at.

type Props = {
  data: AnalyticsData
}

export function StatisticsTab({ data }: Props) {
  return (
    <>
      <Panel
        title="Descriptive statistics"
        description="SPSS-style summary for each measure. N is the number of books or accounts counted."
      >
        <DescriptivesTable rows={data.descriptives} />
      </Panel>

      <Panel title="How these numbers are calculated">
        <ul className="method">
          <li>
            <strong>Who is counted:</strong> real accounts only. Guest accounts are temporary and
            left out.
          </li>
          <li>
            <strong>Standard deviation:</strong> the sample standard deviation (divides by N minus
            1), the same as SPSS. It needs at least 2 values.
          </li>
          <li>
            <strong>Median:</strong> the middle value. With an even N, the average of the two middle
            values.
          </li>
          <li>
            <strong>Answer percentages:</strong> out of all VeggieBooks. A book can pick more than
            one answer, so a question can add up to more than 100%.
          </li>
          <li>
            <strong>Kept and taken out:</strong> a recipe or secret removed after saving still
            counts as taken out, so that choice is not lost.
          </li>
          <li>
            <strong>Not shown yet:</strong> tests such as p-values or Cronbach's alpha depend on a
            study's design. They will be added per study, once the IRB is approved.
          </li>
        </ul>
      </Panel>
    </>
  )
}