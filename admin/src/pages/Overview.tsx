import { BarList } from '../components/common/BarList'
import { DonutChart } from '../components/common/DonutChart'
import { Panel } from '../components/common/Panel'
import { StatCard } from '../components/common/StatCard'
import type { AdminTab } from '../components/layout/navigation'
import { KeptRemoved } from '../components/overview/KeptRemoved'
import { LiveStatus } from '../components/overview/LiveStatus'
import { RecentActivity } from '../components/overview/RecentActivity'
import { StudyCard } from '../components/overview/StudyCard'
import { TopAnswersList } from '../components/overview/TopAnswersList'
import { WeeklyBooks } from '../components/overview/WeeklyBooks'
import { WhenSaved } from '../components/overview/WhenSaved'
import { useOverview } from '../hooks/useOverview'
import '../styles/overview.css'

// The first screen after sign-in. Everything comes from one call,
// GET /api/admin/overview, loaded again every minute (hooks/useOverview).
// No email or name appears here; people are shown by research ID only.
//
// Top to bottom:
//   live line, four animated cards with trend lines
//   books per week | active study
//   books by vegetable | Secrets Books by category
//   participants by age | when books are saved
//   book details (three rings) | kept vs taken out
//   most chosen answers | recent activity
//
// Numbers that need tracking (time per question, where people stop) are
// added once tracking is built, rather than showing empty or made-up
// values. The page title is in the top bar (AdminShell).

type Props = {
  onOpen: (tab: AdminTab) => void
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

export function Overview({ onOpen }: Props) {
  const { data, error, updatedAt } = useOverview()

  if (!data) {
    return error ? (
      <p className="error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">Loading...</p>
    )
  }

  const books = data.veggieBooks + data.secretsBooks
  const booksWeekly = data.weekly.map((w) => w.veggie + w.secrets)
  const booksThisWeek = booksWeekly[booksWeekly.length - 1] ?? 0

  // Participants over time: how many had joined by the end of each week.
  const before = data.participants - sum(data.joinedWeekly)
  const participantsWeekly = data.joinedWeekly.map((_, i) => before + sum(data.joinedWeekly.slice(0, i + 1)))

  const perBook = data.veggieBooks > 0 ? (data.answersRecorded / data.veggieBooks).toFixed(1) : '0'

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

      <div className="card-grid cols-4">
        <StatCard
          index={0}
          icon="users"
          label="Participants"
          value={data.participants}
          note={`+${data.newThisWeek} in the last 7 days`}
          spark={participantsWeekly}
        />
        <StatCard
          index={1}
          icon="clock"
          label="New this week"
          value={data.newThisWeek}
          note="Joined in the last 7 days"
          spark={data.joinedWeekly}
        />
        <StatCard
          index={2}
          icon="book"
          label="Books saved"
          value={books}
          note={`${booksThisWeek} so far this week`}
          spark={booksWeekly}
        />
        <StatCard
          index={3}
          icon="answers"
          label="Answers recorded"
          value={data.answersRecorded}
          note={`About ${perBook} per VeggieBook`}
          spark={data.answersWeekly}
        />
      </div>

      <div className="overview-row">
        <Panel
          title="Books saved per week"
          aside={
            <span className="muted small">
              {data.veggieBooks.toLocaleString()} VeggieBooks, {data.secretsBooks.toLocaleString()} Secrets Books
              in all
            </span>
          }
        >
          <WeeklyBooks weeks={data.weekly} />
        </Panel>

        <StudyCard onOpen={() => onOpen('studies')} />
      </div>

      <div className="overview-row is-even">
        <Panel title="Books by vegetable">
          <BarList
            rows={data.byVegetable.map((v) => ({ label: v.name, value: v.count }))}
            empty="No VeggieBooks yet."
          />
        </Panel>

        <Panel title="Secrets Books by category">
          <BarList
            rows={data.byCategory.map((c) => ({ label: c.name, value: c.count }))}
            empty="No Secrets Books yet."
          />
        </Panel>
      </div>

      <div className="overview-row is-reverse">
        <Panel title="Participants by age">
          <BarList
            rows={data.ageRanges.map((a) => ({ label: a.name, value: a.count }))}
            empty="No participants yet."
          />
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
                { label: 'Secrets Books', value: data.secretsBooks, color: 'var(--bar-light)' },
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

      <div className="overview-row is-even">
        <Panel
          title="Most chosen answers"
          aside={
            <button type="button" className="link-button" onClick={() => onOpen('questions')}>
              See all
            </button>
          }
        >
          <TopAnswersList answers={data.topAnswers} />
        </Panel>

        <Panel title="Recent activity">
          <RecentActivity items={data.recent} />
        </Panel>
      </div>
    </div>
  )
}