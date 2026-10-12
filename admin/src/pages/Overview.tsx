import { DonutChart } from '../components/common/DonutChart'
import { PageSkeleton } from '../components/common/PageSkeleton'
import { Panel } from '../components/common/Panel'
import { StatCard } from '../components/common/StatCard'
import type { AdminTab } from '../components/layout/navigation'
import { AgeColumns } from '../components/overview/AgeColumns'
import { KeptRemoved } from '../components/overview/KeptRemoved'
import { LiveStatus } from '../components/overview/LiveStatus'
import { PictureRings } from '../components/overview/PictureRings'
import { RecentActivity } from '../components/overview/RecentActivity'
import { StudyCard } from '../components/overview/StudyCard'
import { WeeklyBooks, WeeklyLegend } from '../components/overview/WeeklyBooks'
import { WhenSaved } from '../components/overview/WhenSaved'
import { useOverview } from '../hooks/useOverview'
import '../styles/overview.css'

// Admin landing page. Data comes from GET /api/admin/overview and refreshes
// every minute (hooks/useOverview). Participants appear by research ID only.

type Props = {
  onOpen: (tab: AdminTab) => void
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const lastOf = (values: number[]) => values[values.length - 1] ?? 0
const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`

export function Overview({ onOpen }: Props) {
  const { data, error, updatedAt } = useOverview()

  if (!data) {
    return error ? (
      <p className="error" role="alert">
        {error}
      </p>
    ) : (
      <PageSkeleton cards={5} label="Loading overview" />
    )
  }

  const books = data.veggieBooks + data.secretsBooks
  const booksWeekly = data.weekly.map((w) => w.veggie + w.secrets)
  const booksThisWeek = lastOf(booksWeekly)
  const joinedLastWeek = data.joinedWeekly[data.joinedWeekly.length - 2] ?? 0
  const answersThisWeek = lastOf(data.answersWeekly)

  // Running participant total at the end of each week.
  const before = data.participants - sum(data.joinedWeekly)
  const participantsWeekly = data.joinedWeekly.map((_, i) => before + sum(data.joinedWeekly.slice(0, i + 1)))

  const perBook = data.veggieBooks > 0 ? Math.round((data.answersRecorded / data.veggieBooks) * 10) / 10 : 0

  return (
    <div className="overview">
      <LiveStatus updatedAt={updatedAt} failed={error !== null} />

      {data.recoveryLocked > 0 && (
        <p className="note">
          {data.recoveryLocked === 1
            ? '1 account has password reset locked.'
            : `${data.recoveryLocked} accounts have password reset locked.`}{' '}
          See Settings.
        </p>
      )}

      <div className="overview-cards">
        <StatCard
          index={0}
          icon="users"
          label="Participants"
          value={data.participants}
          note={data.newThisWeek > 0 ? `${plural(data.newThisWeek, 'person', 'people')} joined in the last 7 days` : 'No one new in the last 7 days'}
          chip={`+${data.newThisWeek} this week`}
          chipUp={data.newThisWeek > 0}
          spark={participantsWeekly}
        />
        <StatCard
          index={1}
          icon="clock"
          label="New this week"
          value={data.newThisWeek}
          note="Joined in the last 7 days"
          chip={`${joinedLastWeek} last week`}
          spark={data.joinedWeekly}
        />
        <StatCard
          index={2}
          icon="book"
          label="Books saved"
          value={books}
          note={`${plural(data.veggieBooks, 'VeggieBook', 'VeggieBooks')} and ${plural(data.secretsBooks, 'Secrets Book', 'Secrets Books')}`}
          chip={`${booksThisWeek} this week`}
          chipUp={booksThisWeek > 0}
          spark={booksWeekly}
        />
        <StatCard
          index={3}
          icon="answers"
          label="Answers recorded"
          value={data.answersRecorded}
          note={`About ${perBook} per VeggieBook`}
          chip={`${answersThisWeek} this week`}
          chipUp={answersThisWeek > 0}
          spark={data.answersWeekly}
        />
        <StudyCard index={4} onOpen={() => onOpen('studies')} />
      </div>

      <div className="overview-row">
        <Panel
          title="Books saved per week"
          aside={<WeeklyLegend veggie={data.veggieBooks} secrets={data.secretsBooks} />}
        >
          <WeeklyBooks weeks={data.weekly} />
        </Panel>

        <Panel title="Recent activity">
          <RecentActivity items={data.recent} />
        </Panel>
      </div>

      <div className="overview-row is-even">
        <Panel title="Books by vegetable">
          <PictureRings rows={data.byVegetable} unit="VeggieBooks" tone="green" empty="No VeggieBooks yet." />
        </Panel>

        <Panel title="Secrets Books by category">
          <PictureRings rows={data.byCategory} unit="Secrets Books" tone="violet" empty="No Secrets Books yet." />
        </Panel>
      </div>

      <div className="overview-row is-reverse">
        <Panel title="Participants by age">
          <AgeColumns ages={data.ageRanges} empty="No participants yet." />
        </Panel>

        <Panel title="When books are saved" aside={<span className="muted small">Eastern time</span>}>
          <WhenSaved heat={data.heat} />
        </Panel>
      </div>

      <div className="overview-row">
        <Panel title="Book details">
          <div className="donut-grid">
            <DonutChart
              title="Book type"
              unit="books"
              parts={[
                { label: 'VeggieBooks', value: data.veggieBooks, color: 'var(--bar-fill)' },
                { label: 'Secrets Books', value: data.secretsBooks, color: '#a78bfa' },
              ]}
            />
            <DonutChart
              title="Language"
              unit="books"
              parts={[
                { label: 'English', value: data.languages.english, color: 'var(--bar-fill)' },
                { label: 'Spanish', value: data.languages.spanish, color: 'var(--bar-light)' },
              ]}
            />
            <DonutChart
              title="Cover"
              unit="books"
              parts={[
                { label: 'Built-in', value: data.covers.builtin, color: 'var(--bar-fill)' },
                { label: 'Personal photo', value: data.covers.personal, color: 'var(--bar-light)' },
              ]}
            />
          </div>
        </Panel>

        <Panel title="Kept vs taken out later">
          <KeptRemoved items={data.items} />
        </Panel>
      </div>
    </div>
  )
}