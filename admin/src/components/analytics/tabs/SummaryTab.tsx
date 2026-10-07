import type { AnalyticsData } from '../../../types/analytics'
import { percent } from '../../../utils/math'
import { Panel } from '../../common/Panel'
import { ActivityChart } from '../ActivityChart'
import { CoverBreakdown } from '../CoverBreakdown'
import { KeyFindings } from '../KeyFindings'
import { KpiCard } from '../KpiCard'
import { RankedList } from '../RankedList'

// The first Analytics tab: headline numbers, findings, activity, and a
// short look at vegetables and covers. "See all" opens the Books tab.

type Props = {
  data: AnalyticsData
  onSeeBooks: () => void
}

export function SummaryTab({ data, onSeeBooks }: Props) {
  const s = data.summary
  const totalBooks = s.veggieBooks + s.secretsBooks
  const recipes = data.descriptives.find((d) => d.variable === 'Recipes per VeggieBook')
  const recipesMean = recipes && recipes.mean !== null ? recipes.mean.toFixed(1) : 'n/a'
  const recipesMedian =
    recipes && recipes.median !== null ? `Median ${recipes.median}` : 'No VeggieBooks yet'

  return (
    <>
      <div className="kpi-grid">
        <KpiCard icon="users" label="Accounts" value={String(s.accounts)} detail="Guests not included" />
        <KpiCard
          icon="book"
          label="VeggieBooks saved"
          value={String(s.veggieBooks)}
          detail={`${percent(s.veggieBooks, totalBooks)}% of all books`}
        />
        <KpiCard
          icon="sparkle"
          label="Secrets Books saved"
          value={String(s.secretsBooks)}
          detail={`${percent(s.secretsBooks, totalBooks)}% of all books`}
        />
        <KpiCard
          icon="list"
          label="Avg. recipes per VeggieBook"
          value={recipesMean}
          detail={recipesMedian}
        />
        <KpiCard
          icon="image"
          label="Personal covers"
          value={`${percent(s.personalCovers, totalBooks)}%`}
          detail={`${s.personalCovers} of ${totalBooks} books`}
        />
        <KpiCard
          icon="globe"
          label="Books in Spanish"
          value={`${percent(s.spanishBooks, totalBooks)}%`}
          detail={`${s.spanishBooks} of ${totalBooks} books`}
        />
      </div>

      <Panel title="Key findings" description="Written from the numbers on these tabs.">
        <KeyFindings data={data} />
      </Panel>

      <Panel title="Activity" description="New accounts and saved books per week, last 12 weeks.">
        <ActivityChart weeks={data.weeks} />
      </Panel>

      <div className="panel-grid">
        <Panel
          title="Top vegetables"
          description="Share of VeggieBooks for each vegetable."
          aside={
            <button type="button" className="link-button" onClick={onSeeBooks}>
              See all
            </button>
          }
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

        <Panel title="Covers" description="Built-in covers versus personal photos.">
          <CoverBreakdown builtIn={s.builtInCovers} personal={s.personalCovers} topCovers={[]} />
        </Panel>
      </div>
    </>
  )
}