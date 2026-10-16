import { useState } from 'react'
import type { AllDataQuestion } from '../../types/allData'
import type { SheetRow } from '../../types/research'
import { bookTitle, isSecrets, shortDate, shortTime } from '../../utils/allDataFormat'
import { questionHint, questionName, withVegetable } from '../../utils/answerNames'
import { AllDataIcon } from './AllDataIcons'
import { ItemPreviewCard, ItemThumb, useItemPreview } from './ItemPreview'

// The side panel for one book, with two tabs so it is clear where things
// are:
//
//   Questions  the answers, grouped by question with the real wording and
//              every choice (picked ones checked)
//   Recipes    the recipes (or secrets) in the book, each with a small
//              picture: kept, then taken out. Hover one to see the full
//              picture and its details.
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

export function BookPanel({ book, items, questions, onClose }: Props) {
  const secrets = isSecrets(book)
  const [tab, setTab] = useState<PanelTab>(secrets ? 'items' : 'questions')
  const { preview, handlers } = useItemPreview()
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
    <aside className="vbd-panel" aria-label="Book details">
      <div className={secrets ? 'vbd-panel-head is-violet' : 'vbd-panel-head'}>
        <div className="vbd-panel-title">
          <span className="vbd-panel-id">
            <span className="vbd-panel-id-label">Research ID:</span>
            <span className="vbd-id">{String(book.participant_id)}</span>
          </span>
          <strong>{bookTitle(book)}</strong>
          <span className="vbd-panel-when">
            <AllDataIcon name="calendar" size={16} className="vbd-panel-cal" />
            <span className="vbd-date">
              {String(book.day ?? '')}, {shortDate(book.date)}
            </span>
            <span className="vbd-time">{shortTime(book.time)}</span>
            <span className="vbd-panel-bookno">Book {String(book.book_no)}</span>
          </span>
        </div>
        <button type="button" className="vbd-panel-close" aria-label="Close" onClick={onClose}>
          <AllDataIcon name="close" size={18} />
        </button>
      </div>

      <div className="vbd-panel-tabs" role="tablist" aria-label="Book details">
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'vbd-panel-tab is-active' : 'vbd-panel-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="vbd-panel-tab-count">{t.count}</span>
            </button>
          ))}
      </div>

      {tab === 'questions' && !secrets && (
        <div className="vbd-panel-section">
          <span className="vbd-panel-hint">Checked answers are the ones this person picked.</span>
          {questions.map((q) => {
            const count = q.choices.filter((c) => book[c.key] === 1).length
            return (
              <div key={q.no} className="vbd-question">
                <div className="vbd-question-head">
                  <span className="vbd-question-tag">
                    <span className="vbd-q-no">Q{q.no}</span>
                    <span className="vbd-q-name">{questionName(q.no)}</span>
                  </span>
                  <span className="vbd-q-count">
                    {count} of {q.choices.length}
                  </span>
                </div>
                <p className="vbd-question-text">{withVegetable(q.label, vegetable)}</p>
                <p className="vbd-question-hint">{questionHint(q.no)}</p>
                <ul className="vbd-choices">
                  {q.choices.map((c) => {
                    const on = book[c.key] === 1
                    return (
                      <li key={c.key} className={on ? 'vbd-choice is-on' : 'vbd-choice'}>
                        <span className="vbd-check" aria-hidden="true">
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
        <div className="vbd-panel-section">
          <span className="vbd-panel-hint">Hover a {secrets ? 'secret' : 'recipe'} to see its picture and details.</span>
          {[
            { label: 'KEPT', list: kept, out: false },
            { label: 'TAKEN OUT LATER', list: out, out: true },
          ].map((group) => (
            <div key={group.label} className="vbd-item-group">
              <div className="vbd-list-head">
                <span className="vbd-panel-label">{group.label}</span>
                <span className={group.out ? (group.list.length > 0 ? 'vbd-pill is-out' : 'vbd-pill') : 'vbd-pill is-kept'}>
                  {group.list.length}
                </span>
              </div>
              {group.list.length === 0 && <p className="vbd-faint small">None</p>}
              <ul className="vbd-thumb-list">
                {group.list.map((r, i) => (
                  <li
                    key={`${r.item_code}-${r.item_title}-${i}`}
                    className={group.out ? 'vbd-thumb-row is-out' : 'vbd-thumb-row'}
                    tabIndex={0}
                    {...handlers(r)}
                  >
                    <ItemThumb row={r} />
                    <span className="vbd-thumb-text">
                      <span className="vbd-thumb-name">{String(r.item_title ?? '')}</span>
                      <span className="vbd-thumb-meta">
                        {r.item_code ? String(r.item_code) : String(r.item_type ?? '')}
                        {Number(r.extra_copies ?? 0) > 0 && (
                          <span className="vbd-copies"> +{String(r.extra_copies)} copies</span>
                        )}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ItemPreviewCard preview={preview} />
    </aside>
  )
}