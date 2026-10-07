import { useEffect, useState } from 'react'
import { NumberCard } from '../components/common/NumberCard'
import type { Overview as OverviewData } from '../types/admin'
import { api } from '../utils/api'

// The first screen after sign-in: the main counts. Counts only; no account
// is named here. Locked password resets show in orange when there are any.

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

  return (
    <>
      <h1 className="page-title">Overview</h1>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!data && !error && <p className="muted">Loading...</p>}

      {data && (
        <div className="card-grid cols-3">
          <NumberCard value={String(data.accounts)} label="Accounts" />
          <NumberCard value={String(data.newAccountsThisWeek)} label="New this week" />
          <NumberCard value={String(data.activeGuests)} label="Guests right now" />
          <NumberCard value={String(data.veggieBooks)} label="VeggieBooks saved" />
          <NumberCard value={String(data.secretsBooks)} label="Secrets Books saved" />
          <NumberCard
            value={String(data.recoveryLocked)}
            label="Password reset locked"
            warn={data.recoveryLocked > 0}
          />
        </div>
      )}
    </>
  )
}