import { useState } from 'react'
import type { AllDataQuestion } from '../../types/allData'
import type { SheetRow } from '../../types/research'
import { bookTitle, isSecrets, shortDate, shortTime } from '../../utils/allDataFormat'
import { questionHint, questionName, withVegetable } from '../../utils/answerNames'

// The side panel for one book: its answers, grouped by question with the
// question's real wording and every choice (picked ones checked), then the
// recipes and secrets in it. The recipes come from file 2, so the panel
// shows exactly what the Recipes and secrets file has for this book.

const FIRST_ITEMS = 5

type Props = {
  book: SheetRow
  items: SheetRow[]
  questions: AllDataQuestion[]
  onClose: () => void
}

function itemName(row: SheetRow) {
  return row.item_code ? `${row.item_code} ${row.item_title}` : String(row.item_title ?? '')
}

export function BookPanel({ book, items, questions, onClose }: Props) {
  const [expanded, setExpanded] = useState(false)
  const secrets = isSecrets(book)
  const vegetable = typeof book.vegetable === 'string' ? book.vegetable : null

  const kept = items.filter((r) => r.status === 'Kept')
  const out = items.filter((r) => r.status !== 'Kept')
  const keptShown = expanded ? kept : kept.slice(0, FIRST_ITEMS)
  const copies = kept.reduce((sum, r) => sum + Number(r.extra_copies ?? 0), 0)
  const keptLabel = secrets ? 'SECRETS KEPT' : 'RECIPES KEPT'

  return (
    <aside className="ad-panel" aria-label="Book details">
      <div className="ad-panel-head">
        <div className="ad-panel-title">
          <span className="ad-id">{String(book.participant_id)}</span>
          <strong>{bookTitle(book)}</strong>
          <span className="muted small">
            {String(book.day ?? '')}, {shortDate(book.date)}, {shortTime(book.time)}. Book {String(book.book_no)} for
            this person.
          </span>
        </div>
        <button type="button" className="ad-panel-close" aria-label="Close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="ad-panel-section">
        <span className="ad-panel-label">ANSWERS BY QUESTION</span>
        {secrets && <p className="ad-faint small">Secrets Books have no questions.</p>}
        {!secrets &&
          questions.map((q) => {
            const picked = q.choices.filter((c) => book[c.key] === 1).length
            return (
              <div key={q.no} className="ad-question">
                <div className="ad-question-head">
                  <span className="ad-question-tag">
                    <span className="ad-q-no">Q{q.no}</span>
                    <span className="ad-q-name">{questionName(q.no)}</span>
                  </span>
                  <span className="muted small">
                    {picked} of {q.choices.length}
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

      <div className="ad-panel-section">
        <span className="ad-panel-label">
          {keptLabel} ({kept.length})
        </span>
        {kept.length === 0 && <p className="ad-faint small">None</p>}
        <ul className="ad-items">
          {keptShown.map((r, i) => (
            <li key={`${r.item_code}-${r.item_title}-${i}`}>
              {itemName(r)}
              {Number(r.extra_copies ?? 0) > 0 && <span className="muted small"> +{String(r.extra_copies)} copies</span>}
            </li>
          ))}
        </ul>
        {kept.length > FIRST_ITEMS && (
          <button type="button" className="ad-link" onClick={() => setExpanded((e) => !e)}>
            {expanded ? 'Show less' : `Show all ${kept.length}`}
          </button>
        )}
        {copies > 0 && <p className="muted small">{copies} extra copies in this book.</p>}

        <span className="ad-panel-label ad-panel-label-gap">TAKEN OUT LATER ({out.length})</span>
        {out.length === 0 && <p className="ad-faint small">None</p>}
        <ul className="ad-items is-out">
          {out.map((r, i) => (
            <li key={`${r.item_code}-${r.item_title}-${i}`}>{itemName(r)}</li>
          ))}
        </ul>
      </div>
    </aside>
  )
}