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
    <aside className="ad-panel" aria-label="Book details">
      <div className={secrets ? 'ad-panel-head is-violet' : 'ad-panel-head'}>
        <div className="ad-panel-title">
          <span className="ad-panel-id">
            <span className="ad-panel-id-label">Research ID:</span>
            <span className="ad-id">{String(book.participant_id)}</span>
          </span>
          <strong>{bookTitle(book)}</strong>
          <span className="ad-panel-when">
            <AllDataIcon name="calendar" size={16} className="ad-panel-cal" />
            <span className="ad-date">
              {String(book.day ?? '')}, {shortDate(book.date)}
            </span>
            <span className="ad-time">{shortTime(book.time)}</span>
            <span className="ad-panel-bookno">Book {String(book.book_no)}</span>
          </span>
        </div>
        <button type="button" className="ad-panel-close" aria-label="Close" onClick={onClose}>
          <AllDataIcon name="close" size={18} />
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
          <span className="ad-panel-hint">Hover a {secrets ? 'secret' : 'recipe'} to see its picture and details.</span>
          {[
            { label: 'KEPT', list: kept, out: false },
            { label: 'TAKEN OUT LATER', list: out, out: true },
          ].map((group) => (
            <div key={group.label} className="ad-item-group">
              <div className="ad-list-head">
                <span className="ad-panel-label">{group.label}</span>
                <span className={group.out ? (group.list.length > 0 ? 'ad-pill is-out' : 'ad-pill') : 'ad-pill is-kept'}>
                  {group.list.length}
                </span>
              </div>
              {group.list.length === 0 && <p className="ad-faint small">None</p>}
              <ul className="ad-thumb-list">
                {group.list.map((r, i) => (
                  <li
                    key={`${r.item_code}-${r.item_title}-${i}`}
                    className={group.out ? 'ad-thumb-row is-out' : 'ad-thumb-row'}
                    tabIndex={0}
                    {...handlers(r)}
                  >
                    <ItemThumb row={r} />
                    <span className="ad-thumb-text">
                      <span className="ad-thumb-name">{String(r.item_title ?? '')}</span>
                      <span className="ad-thumb-meta">
                        {r.item_code ? String(r.item_code) : String(r.item_type ?? '')}
                        {Number(r.extra_copies ?? 0) > 0 && (
                          <span className="ad-copies"> +{String(r.extra_copies)} copies</span>
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