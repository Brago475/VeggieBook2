import { useEffect, useState } from 'react'
import type { PickPerson } from '../../types/notifications'
import { api } from '../../utils/api'
import { formatDate } from '../../utils/format'

// Picks accounts by research ID, with a search box. Only current, non-admin
// accounts are listed; no email or username is shown.

type Props = {
  label: string
  hint: string
  selected: string[]
  onChange: (ids: string[]) => void
}

export function ResearchIdPicker({ label, hint, selected, onChange }: Props) {
  const [people, setPeople] = useState<PickPerson[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    api<PickPerson[]>('/admin/notifications/people')
      .then((p) => {
        if (!cancelled) setPeople(p)
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const search = query.trim().toUpperCase()
  const shown = (people ?? []).filter((p) => p.researchId.includes(search))
  const chosen = new Set(selected)

  function toggle(id: string) {
    onChange(chosen.has(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  return (
    <div className="nt-picker">
      <div className="nt-picker-head">
        <span className="nt-label">{label}</span>
        <span className="muted">
          {selected.length} chosen
          {selected.length > 0 && (
            <>
              {' '}
              <button type="button" className="nt-link-btn" onClick={() => onChange([])}>
                Clear
              </button>
            </>
          )}
        </span>
      </div>
      <p className="nt-hint">{hint}</p>

      <input
        className="nt-input"
        type="search"
        placeholder="Search research IDs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search research IDs"
      />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!people && !error && <p className="muted">Loading accounts...</p>}

      {people && (
        <ul className="nt-picker-list">
          {shown.length === 0 && <li className="muted nt-picker-empty">No research IDs match.</li>}
          {shown.map((p) => (
            <li key={p.researchId}>
              <label className="nt-picker-row">
                <input type="checkbox" checked={chosen.has(p.researchId)} onChange={() => toggle(p.researchId)} />
                <span className="nt-picker-id">{p.researchId}</span>
                <span className="muted">
                  {p.ageRange ?? 'No age range'}, joined {formatDate(p.joinedAt)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}