import { useState } from 'react'
import type { QaBook, QaData } from '../../types/questions'
import { questionName, shortAnswer } from '../../utils/answerNames'
import { AnswerBars } from './AnswerBars'
import { HeatGrid } from './HeatGrid'
import { downloadCsv, groupsOf, pct, pickedNone, shares, type CompareBy } from './questionMath'

// Questions tab: question list, the selected question's answer shares,
// and a comparison grid by age range, vegetable, language, or week.

type Props = {
  data: QaData
  veggie: QaBook[]
}

const compareOptions: { id: CompareBy; label: string }[] = [
  { id: 'age', label: 'Age range' },
  { id: 'vegetable', label: 'Vegetable' },
  { id: 'language', label: 'Language' },
  { id: 'week', label: 'Week' },
]

const compareNote: Record<CompareBy, string> = {
  age: 'age range',
  vegetable: 'vegetable',
  language: 'language',
  week: 'week (last 8 weeks with books)',
}

export function QuestionsTab({ data, veggie }: Props) {
  const [selected, setSelected] = useState(data.questions[0]?.no ?? 0)
  const [by, setBy] = useState<CompareBy>('age')

  const question = data.questions.find((q) => q.no === selected) ?? data.questions[0]
  if (!question) return <p className="st-muted">No questions found.</p>

  const items = shares(question, veggie)
  const none = pickedNone(question, veggie)
  const perBook = veggie.length === 0 ? 0 : items.reduce((n, c) => n + c.count, 0) / veggie.length
  const groups = groupsOf(by, veggie, data)

  function download() {
    downloadCsv(`question-${question.no}.csv`, [
      ['Answer', 'Books', 'Percent of VeggieBooks'],
      ...items.map((c) => [c.text, c.count, c.percent]),
      ['Picked none', none, pct(none, veggie.length)],
    ])
  }

  return (
    <div className="qa-split">
      <nav className="qa-list" aria-label="Questions">
        <h2>Questions</h2>
        {data.questions.map((q) => {
          const top = shares(q, veggie)[0]
          const on = q.no === question.no
          return (
            <button key={q.no} type="button" className={on ? 'qa-list-item is-on' : 'qa-list-item'} aria-pressed={on} onClick={() => setSelected(q.no)}>
              <span className="qa-q">Q{q.no}</span>
              <span className="qa-list-text">
                <strong>{questionName(q.no)}</strong>
                <span>{top && top.count > 0 ? `Top: ${shortAnswer(top.text)}, ${top.percent}%` : 'No answers yet'}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <section className="qa-panel qa-detail" aria-labelledby="qa-detail-title">
        <div className="qa-detail-head">
          <div>
            <span className="qa-eyebrow">Question {question.no}</span>
            <h2 id="qa-detail-title">{questionName(question.no)}</h2>
            <p>"{question.text}" Several answers can be picked, so shares can add up to more than 100%.</p>
          </div>
          <button type="button" className="st-button" onClick={download}>
            Download question
          </button>
        </div>

        <div className="qa-facts">
          <span>
            <strong>{veggie.length.toLocaleString()}</strong> VeggieBooks
          </span>
          <span>
            <strong>{perBook.toFixed(1)}</strong> answers per book
          </span>
          <span>
            <strong>{none.toLocaleString()}</strong> picked none
          </span>
        </div>

        <AnswerBars items={items} large />

        <div className="qa-compare-head">
          <h3>Compare by</h3>
          <div className="qa-seg" role="radiogroup" aria-label="Compare by">
            {compareOptions.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={by === o.id} className={by === o.id ? 'is-on' : undefined} onClick={() => setBy(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="st-muted">No VeggieBooks to compare.</p>
        ) : (
          <>
            <HeatGrid
              columns={groups.map((g) => ({ key: g.key, label: g.label, note: `n=${g.books.length}` }))}
              rows={items.map((c) => ({
                key: c.attribute,
                label: shortAnswer(c.text),
                cells: groups.map((g) => pct(g.books.filter((b) => b.answers.includes(c.attribute)).length, g.books.length)),
              }))}
            />
            <p className="qa-hint">Each cell: share of VeggieBooks in that {compareNote[by]} that picked the answer.</p>
          </>
        )}
      </section>
    </div>
  )
}