import type { AnalyticsData } from '../../../types/analytics'
import { NumberCard } from '../../common/NumberCard'
import { Panel } from '../../common/Panel'
import { DescriptivesTable } from '../DescriptivesTable'

// Statistics: four headline numbers, the descriptive statistics table, and
// a short method list.

type Props = {
  data: AnalyticsData
}

function value(n: number | null | undefined) {
  return n === null || n === undefined ? 'n/a' : n.toFixed(2)
}

export function StatisticsTab({ data }: Props) {
  const rows = data.descriptives
  const find = (name: string) => rows.find((r) => r.variable === name)
  const recipes = find('Recipes per VeggieBook')
  const answers = find('Answers per VeggieBook')
  const perAccount = find('Books per account')

  return (
    <>
      <div className="card-grid cols-4">
        <NumberCard value={value(recipes?.mean)} label="Mean recipes per book" />
        <NumberCard value={value(recipes?.median)} label="Median recipes per book" />
        <NumberCard value={value(answers?.mean)} label="Mean answers per book" />
        <NumberCard value={value(perAccount?.mean)} label="Mean books per account" />
      </div>

      <Panel title="Descriptive statistics">
        <DescriptivesTable rows={rows} />
      </Panel>

      <Panel title="Method">
        <ul className="method">
          <li>Real accounts only. Guest accounts are temporary and left out.</li>
          <li>Standard deviation is the sample standard deviation (N minus 1), as in SPSS.</li>
          <li>Answer percentages are out of all VeggieBooks. A book can pick more than one answer.</li>
          <li>Items removed after saving still count as taken out.</li>
          <li>Tests such as p-values are added per study once the IRB is approved.</li>
        </ul>
      </Panel>
    </>
  )
}