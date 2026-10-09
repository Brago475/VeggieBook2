import { useState } from 'react'
import type { AllDataQuestion } from '../../types/allData'
import type { SheetRow } from '../../types/research'
import { bookTitle, isSecrets, shortDate, shortTime } from '../../utils/allDataFormat'
import { questionHint, questionName, withVegetable } from '../../utils/answerNames'

// The side panel for one book, with two tabs so it is clear where things
// are:
//
//   Questions  the answers, grouped by question with the real wording and
//              every choice (picked ones checked)
//   Recipes    the recipes (or secrets) in the book: kept, then taken out
//
// Secrets Books have no questions, so they open on their secrets. The
// list comes from file 2, so it matches the Recipes and secrets download.

type PanelTab = 'questions' | 'items'

type Props = {
  book: SheetRow
  items: SheetRow[]
  questions: AllDataQuestion[]
  onClose: () => void
}

function itemName(row: SheetRow) {
  return String(row.item_title ?? '')
}

export function BookPanel({ book, items, questions, onClose }: Props) {
  const secrets = isSecrets(book)
  const [tab, setTab] = useState<PanelTab>(secrets ? 'items' : 'questions')
  const vegetable = typeof book.vegetable === 'string' ? book.vegetable : null

  const kept = items.filter((r) => r.status === 'Kept')
  const out = items.filter((r) => r.status !== 'Kept')
  const picked = questions.reduce((sum, q) => sum + q.choices.filter((c) => book[c.key] === 1).length, 0)
  const itemsLabel = secrets ? 'Secrets' : 'Recipes'

  const tabs: { id: PanelTab; label: string; count: number; hidden: boolean }[] = [
    { id: 'questions', label: 'Questions', count: picked, hidden: secrets },
    { id: 'items', label: itemsLabel, count: items.length, hidden: false },
  ]

  return (
    <aside className="ad-panel" aria-label="Book details">
      <div className="ad-panel-head">
        <div className="ad-panel-title">
          <span className="ad-id">{String(book.participant_id)}</span>
          <strong>{bookTitle(book)}</strong>
          <span className="ad-panel-when">
            <span className="ad-date">
              {String(book.day ?? '')}, {shortDate(book.date)}
            </span>
            <span className="ad-time">{shortTime(book.time)}</span>
            <span className="ad-panel-bookno">Book {String(book.book_no)}</span>
          </span>
        </div>
        <button type="button" className="ad-panel-close" aria-label="Close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="ad-panel-tabs" role="tablist" aria-label="Book details">
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'ad-panel-tab is-active' : 'ad-panel-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="ad-panel-tab-count">{t.count}</span>
            </button>
          ))}
      </div>

      {tab === 'questions' && !secrets && (
        <div className="ad-panel-section">
          <span className="ad-panel-hint">Checked answers are the ones this person picked.</span>
          {questions.map((q) => {
            const count = q.choices.filter((c) => book[c.key] === 1).length
            return (
              <div key={q.no} className="ad-question">
                <div className="ad-question-head">
                  <span className="ad-question-tag">
                    <span className="ad-q-no">Q{q.no}</span>
                    <span className="ad-q-name">{questionName(q.no)}</span>
                  </span>
                  <span className="ad-q-count">
                    {count} of {q.choices.length}
                  </span>
                </div>
                <p className="ad-question-text">{withVegetable(q.label, vegetable)}</p>
                <p className="ad-question-hint">{questionHint(q.no)}</p>
                <ul className="ad-choices">
                  {q.choices.map((c) => {
                    const on = book[c.key] === 1
                    return (
                      <li key={c.key} className={on ? 'ad-choice is-on' : 'ad-choice'}>
                        <span className="ad-check" aria-hidden="true">
                          {on ? '✓' : ''}
                        </span>
                        <span>{withVegetable(c.text, vegetable)}</span>
                        <span className="sr-only">{on ? ' (picked)' : ' (not picked)'}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'items' && (
        <div className="ad-panel-section">
          <div className="ad-list-head">
            <span className="ad-panel-label">KEPT</span>
            <span className="ad-pill is-kept">{kept.length}</span>
          </div>
          {kept.length === 0 && <p className="ad-faint small">None</p>}
          <ul className="ad-item-list">
            {kept.map((r, i) => (
              <li key={`${r.item_code}-${r.item_title}-${i}`}>
                <span className="ad-code">{String(r.item_code ?? '')}</span>
                <span className="ad-item-name">{itemName(r)}</span>
                {Number(r.extra_copies ?? 0) > 0 && <span className="ad-copies">+{String(r.extra_copies)}</span>}
              </li>
            ))}
          </ul>

          <div className="ad-list-head ad-list-gap">
            <span className="ad-panel-label">TAKEN OUT LATER</span>
            <span className={out.length > 0 ? 'ad-pill is-out' : 'ad-pill'}>{out.length}</span>
          </div>
          {out.length === 0 && <p className="ad-faint small">None</p>}
          <ul className="ad-item-list is-out">
            {out.map((r, i) => (
              <li key={`${r.item_code}-${r.item_title}-${i}`}>
                <span className="ad-code">{String(r.item_code ?? '')}</span>
                <span className="ad-item-name">{itemName(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}