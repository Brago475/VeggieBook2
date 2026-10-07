import { useEffect, useState } from 'react'
import type { Overview as OverviewData } from '../types/admin'
import { api } from '../utils/api'
import '../styles/overview.css'

// The numbers at the top of the admin site. Counts only: no account is
// named on this screen.

export function Overview() {
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

  const stats = [
    { label: 'Accounts', value: data.accounts },
    { label: 'New this week', value: data.newAccountsThisWeek },
    { label: 'VeggieBooks saved', value: data.veggieBooks },
    { label: 'Secrets Books saved', value: data.secretsBooks },
    { label: 'Guests right now', value: data.activeGuests },
    {
      label: 'Password reset locked',
      value: data.recoveryLocked,
      warn: data.recoveryLocked > 0,
    },
  ]

  return (
    <>
      <h1 className="page-title">Overview</h1>
      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className={s.warn ? 'card stat is-warn' : 'card stat'}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </>
  )
}