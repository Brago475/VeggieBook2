import type { AnalyticsData } from '../../../types/analytics'
import { NumberCard } from '../../common/NumberCard'
import { Panel } from '../../common/Panel'
import { ActivityChart } from '../ActivityChart'
import { KeyFindings } from '../KeyFindings'

// Summary: four headline numbers, activity over 12 weeks, and six key
// findings.

type Props = {
  data: AnalyticsData
}

export function SummaryTab({ data }: Props) {
  const s = data.summary
  const recipes = data.descriptives.find((d) => d.variable === 'Recipes per VeggieBook')

  return (
    <>
      <div className="card-grid cols-4">
        <NumberCard value={String(s.accounts)} label="Accounts" />
        <NumberCard value={String(s.veggieBooks)} label="VeggieBooks" />
        <NumberCard value={String(s.secretsBooks)} label="Secrets Books" />
        <NumberCard
          value={recipes && recipes.mean !== null ? recipes.mean.toFixed(1) : 'n/a'}
          label="Avg. recipes per book"
        />
      </div>

      <Panel title="Activity, last 12 weeks">
        <ActivityChart weeks={data.weeks} />
      </Panel>

      <section className="section">
        <h2 className="section-title">Key findings</h2>
        <KeyFindings data={data} />
      </section>
    </>
  )
}