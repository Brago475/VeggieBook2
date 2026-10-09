import { useEffect, useState } from 'react'
import { NumberCard } from '../components/common/NumberCard'
import { Panel } from '../components/common/Panel'
import type { AdminTab } from '../components/layout/navigation'
import { RecentActivity } from '../components/overview/RecentActivity'
import { StudyCard } from '../components/overview/StudyCard'
import { TopAnswersList } from '../components/overview/TopAnswersList'
import { WeeklyBooks } from '../components/overview/WeeklyBooks'
import type { Overview as OverviewData } from '../types/admin'
import { api } from '../utils/api'
import '../styles/overview.css'

// The first screen after sign-in. Everything comes from one call,
// GET /api/admin/overview. No email or name appears here; people are shown
// by research ID only.
//
// Numbers that need tracking (time per question, where people stop) are
// not shown yet. They are added once tracking is built, rather than
// showing empty or made-up values.
//
// The page title is in the top bar (AdminShell), so this page starts with
// the cards.

type Props = {
  onOpen: (tab: AdminTab) => void
}

export function Overview({ onOpen }: Props) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api<OverviewData>('/admin/overview')
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (!data) return <p className="muted">Loading...</p>

  const books = data.veggieBooks + data.secretsBooks

  return (
    <div className="overview">
      {data.recoveryLocked > 0 && (
        <p className="note">
          {data.recoveryLocked === 1
            ? '1 account has password reset locked.'
            : `${data.recoveryLocked} accounts have password reset locked.`}{' '}
          See Settings.
        </p>
      )}

      <div className="card-grid cols-4">
        <NumberCard icon="users" tone="green" label="Participants" value={data.participants.toLocaleString()} />
        <NumberCard icon="clock" tone="blue" label="New this week" value={data.newThisWeek.toLocaleString()} />
        <NumberCard icon="book" tone="amber" label="Books saved" value={books.toLocaleString()} />
        <NumberCard
          icon="answers"
          tone="violet"
          label="Answers recorded"
          value={data.answersRecorded.toLocaleString()}
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