import type { AnalyticsData } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { SeeAllButton } from '../../common/SeeAllButton'
import { ActivityChart } from '../ActivityChart'
import { CoverBreakdown } from '../CoverBreakdown'
import { KeyFindings } from '../KeyFindings'
import { KpiCard } from '../KpiCard'
import { RankedList } from '../RankedList'

// The first Analytics tab: headline numbers, findings, activity, top
// vegetables, and covers. "See all" opens the Books tab.

type Props = {
  data: AnalyticsData
  onSeeBooks: () => void
}

export function SummaryTab({ data, onSeeBooks }: Props) {
  const s = data.summary
  const recipes = data.descriptives.find((d) => d.variable === 'Recipes per VeggieBook')
  const recipesMean = recipes && recipes.mean !== null ? recipes.mean.toFixed(1) : 'n/a'

  return (
    <>
      <div className="kpi-grid">
        <KpiCard icon="users" label="Accounts" value={String(s.accounts)} />
        <KpiCard icon="book" label="VeggieBooks" value={String(s.veggieBooks)} />
        <KpiCard icon="sparkle" label="Secrets Books" value={String(s.secretsBooks)} />
        <KpiCard icon="list" label="Avg. recipes per book" value={recipesMean} />
      </div>

      <div className="panel-grid">
        <Panel icon="bulb" title="Key findings">
          <KeyFindings data={data} />
        </Panel>

        <Panel icon="activity" title="Activity" aside={<span className="meta-pill">Last 12 weeks</span>}>
          <ActivityChart weeks={data.weeks} />
        </Panel>
      </div>

      <div className="panel-grid">
        <Panel
          icon="leaf"
          title="Top vegetables"
          description="Share of VeggieBooks for each vegetable."
          aside={<SeeAllButton onClick={onSeeBooks} />}
        >
          <RankedList
            emptyText="No VeggieBooks yet."
            total={s.veggieBooks}
            items={data.vegetables.slice(0, 5).map((v) => ({
              key: v.code,
              label: v.name,
              image: v.image,
              count: v.books,
            }))}
          />
        </Panel>

        <Panel
          icon="camera"
          title="Covers"
          description="Built-in covers versus personal photos."
          aside={<SeeAllButton onClick={onSeeBooks} />}
        >
          <CoverBreakdown
            builtIn={s.builtInCovers}
            personal={s.personalCovers}
            topCovers={data.topCovers}
            limit={5}
          />
        </Panel>
      </div>
    </>
  )
}