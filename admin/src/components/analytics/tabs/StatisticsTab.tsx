import type { AnalyticsData } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { DescriptivesTable } from '../DescriptivesTable'

// Descriptive statistics, and how the numbers on these tabs are worked out.

type Props = {
  data: AnalyticsData
}

export function StatisticsTab({ data }: Props) {
  return (
    <>
      <Panel icon="table" title="Descriptive statistics">
        <DescriptivesTable rows={data.descriptives} />
      </Panel>

      <Panel icon="bulb" title="Method">
        <ul className="method">
          <li>Real accounts only. Guest accounts are temporary and left out.</li>
          <li>Standard deviation is the sample standard deviation (N minus 1), as in SPSS.</li>
          <li>Answer percentages are out of all VeggieBooks. A book can pick more than one answer.</li>
          <li>Items removed after saving count as taken out, so that choice is kept.</li>
          <li>Tests such as p-values are added per study once the IRB is approved.</li>
        </ul>
      </Panel>
    </>
  )
}