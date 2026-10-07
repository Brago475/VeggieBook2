import { useEffect, useState } from 'react'
import { AnswersTab } from '../components/analytics/tabs/AnswersTab'
import { BooksTab } from '../components/analytics/tabs/BooksTab'
import { PeopleTab } from '../components/analytics/tabs/PeopleTab'
import { StatisticsTab } from '../components/analytics/tabs/StatisticsTab'
import { SummaryTab } from '../components/analytics/tabs/SummaryTab'
import { Tabs } from '../components/common/Tabs'
import { StatIcon } from '../components/icons/StatIcons'
import type { AnalyticsData } from '../types/analytics'
import { api } from '../utils/api'
import { formatDateTime } from '../utils/format'
import '../styles/analytics.css'

// Analytics from the data the app already keeps: accounts and saved books.
// Real accounts only; guests are left out. No account is named here.
//
// Split into tabs so each view shows one topic. Study tracking (time per
// question, sessions) will add more once the IRB is approved.

type AnalyticsTab = 'summary' | 'books' | 'answers' | 'people' | 'statistics'

const tabs: { id: AnalyticsTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'books', label: 'Books' },
  { id: 'answers', label: 'Answers' },
  { id: 'people', label: 'People' },
  { id: 'statistics', label: 'Statistics' },
]

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<AnalyticsTab>('summary')
  const [loading, setLoading] = useState(true)

  // Bumped by Refresh to load the numbers again.
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    api<AnalyticsData>('/admin/analytics')
      .then((d) => {
        if (cancelled) return
        setData(d)
        setError(null)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [version])

  function refresh() {
    setLoading(true)
    setVersion((v) => v + 1)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="muted">How VeggieBook is used, from saved books in real accounts.</p>
        </div>
        <div className="page-actions">
          {data && <span className="meta-pill">Updated {formatDateTime(data.generatedAt)}</span>}
          <button type="button" className="button-secondary icon-button" onClick={refresh} disabled={loading}>
            <StatIcon name="refresh" size={16} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Analytics views" />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!data && !error && <p className="muted">Loading...</p>}

      {data && (
        <div className="tab-content">
          {tab === 'summary' && <SummaryTab data={data} onSeeBooks={() => setTab('books')} />}
          {tab === 'books' && <BooksTab data={data} />}
          {tab === 'answers' && <AnswersTab data={data} />}
          {tab === 'people' && <PeopleTab data={data} />}
          {tab === 'statistics' && <StatisticsTab data={data} />}
        </div>
      )}
    </>
  )
}