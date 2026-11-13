import { useState } from 'react'
import '../../styles/drafts.css'

// Draft cards, used by Playlists and Messages: a Draft badge, the name, a
// short line about what is in it, who saved it and when, and Continue and
// Discard. Discard asks once before removing.

export type DraftRow = {
  id: number
  title: string
  detail: string
  saved: string
}

type Props = {
  rows: DraftRow[]
  empty: string
  onContinue: (id: number) => void
  onDiscard: (id: number) => Promise<void>
}

export function DraftList({ rows, empty, onContinue, onDiscard }: Props) {
  const [asking, setAsking] = useState<number | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  if (rows.length === 0) {
    return (
      <div className="nt-empty">
        <p className="st-muted">{empty}</p>
      </div>
    )
  }

  async function discard(id: number) {
    setBusy(id)
    await onDiscard(id)
    setBusy(null)
    setAsking(null)
  }

  return (
    <ul className="dr-list">
      {rows.map((row) => (
        <li key={row.id} className="dr-card">
          <span className="dr-badge">Draft</span>
          <strong className="dr-title">{row.title}</strong>
          <span className="dr-detail">{row.detail}</span>
          <span className="dr-saved">{row.saved}</span>

          {asking === row.id ? (
            <div className="dr-confirm" role="alertdialog" aria-label={`Discard ${row.title}?`}>
              <span>Discard this draft? It can't be brought back.</span>
              <div className="dr-actions">
                <button type="button" className="st-button" disabled={busy === row.id} onClick={() => setAsking(null)}>
                  Keep it
                </button>
                <button
                  type="button"
                  className="st-button is-orange"
                  disabled={busy === row.id}
                  onClick={() => void discard(row.id)}
                >
                  {busy === row.id ? 'Discarding...' : 'Discard'}
                </button>
              </div>
            </div>
          ) : (
            <div className="dr-actions">
              <button type="button" className="st-button is-green" onClick={() => onContinue(row.id)}>
                Continue
              </button>
              <button type="button" className="st-button" onClick={() => setAsking(row.id)}>
                Discard
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}