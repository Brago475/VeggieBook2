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
      <Panel title="Age ranges" description="Accounts by the age range picked at sign-up.">
        <AgeChart ageRanges={data.ageRanges} />
      </Panel>

      <Panel title="Books by language" description="The language each book was made in.">
        <RankedList
          emptyText="No books yet."
          total={totalBooks}
          items={[
            { key: 'en', label: 'English', count: s.englishBooks },
            { key: 'es', label: 'Spanish', count: s.spanishBooks },
          ]}
        />
        <p className="muted small panel-foot">
          {s.extraCopies} extra {s.extraCopies === 1 ? 'copy' : 'copies'} asked for across all books.
        </p>
      </Panel>
    </div>
  )
}