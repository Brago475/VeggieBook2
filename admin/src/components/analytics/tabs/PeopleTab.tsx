import type { AnalyticsData } from '../../../types/analytics'
import { percent, plural } from '../../../utils/math'
import { NumberCard } from '../../common/NumberCard'
import { Panel } from '../../common/Panel'
import { AgeChart } from '../AgeChart'

// People: age ranges and languages, without naming anyone.

type Props = {
  data: AnalyticsData
}

export function PeopleTab({ data }: Props) {
  const s = data.summary
  const totalBooks = s.veggieBooks + s.secretsBooks

  return (
    <>
      <Panel title="Age ranges">
        <AgeChart ageRanges={data.ageRanges} />
      </Panel>

      <section className="section">
        <h2 className="section-title">Languages</h2>
        <div className="card-grid cols-2">
          <NumberCard
            value={`${percent(s.englishBooks, totalBooks)}%`}
            label={`English, ${plural(s.englishBooks, 'book')}`}
          />
          <NumberCard
            value={`${percent(s.spanishBooks, totalBooks)}%`}
            label={`Spanish, ${plural(s.spanishBooks, 'book')}`}
          />
        </div>
      </section>
    </>
  )
}