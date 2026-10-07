import type { AnalyticsData } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { AgeChart } from '../AgeChart'
import { RankedList } from '../RankedList'

// Who uses the app, without naming anyone: age ranges and languages.

type Props = {
  data: AnalyticsData
}

export function PeopleTab({ data }: Props) {
  const s = data.summary
  const totalBooks = s.veggieBooks + s.secretsBooks

  return (
    <div className="panel-grid">
      <Panel icon="users" title="Age ranges">
        <AgeChart ageRanges={data.ageRanges} />
      </Panel>

      <Panel icon="globe" title="Languages">
        <RankedList
          emptyText="No books yet."
          total={totalBooks}
          items={[
            { key: 'en', label: 'English', count: s.englishBooks },
            { key: 'es', label: 'Spanish', count: s.spanishBooks },
          ]}
        />
      </Panel>
    </div>
  )
}