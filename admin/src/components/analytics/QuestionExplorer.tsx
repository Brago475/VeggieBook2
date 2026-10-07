import { useState } from 'react'
import type { QuestionStats } from '../../types/analytics'

// Pick a question on the left, see its answers on the right as an
// SPSS-style frequency table (answer, count, percent).
//
// A book can pick more than one answer to a question, so the percentages
// are out of all VeggieBooks and can add up to more than 100.

type Props = {
  questions: QuestionStats[]
  totalBooks: number
}

function topChoice(q: QuestionStats) {
  const sorted = [...q.choices].sort((a, b) => b.count - a.count)
  return sorted[0] && sorted[0].count > 0 ? sorted[0] : null
}

export function QuestionExplorer({ questions, totalBooks }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(questions[0]?.id ?? null)

  const index = Math.max(
    0,
    questions.findIndex((q) => q.id === selectedId),
  )
  const selected = questions[index]

  if (!selected) return <p className="muted">No questions found.</p>

  const rows = [...selected.choices].sort((a, b) => b.count - a.count)
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="explorer">
      <ul className="explorer-list">
        {questions.map((q, i) => {
          const top = topChoice(q)
          return (
            <li key={q.id}>
              <button
                type="button"
                className={q.id === selected.id ? 'explorer-item is-active' : 'explorer-item'}
                onClick={() => setSelectedId(q.id)}
              >
                <span className="explorer-num">Q{i + 1}</span>
                <span className="explorer-text">{q.text}</span>
                <span className="explorer-top">
                  {top ? `Top answer: ${top.text}` : 'No answers yet'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="explorer-detail">
        <p className="explorer-meta">
          Question {index + 1} of {questions.length} · {selected.code}
          {selected.hidden && ' · hidden question'}
        </p>
        <h3 className="explorer-question">{selected.text}</h3>
        <p className="muted small">
          Out of {totalBooks} VeggieBooks. A book can pick more than one answer, so the percentages
          can add up to more than 100.
        </p>

        <div className="stats-wrap">
          <table className="freq-table">
            <thead>
              <tr>
                <th>Answer</th>
                <th>Count</th>
                <th>Percent</th>
                <th aria-label="Bar" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.attribute} className={i === 0 && c.count > 0 ? 'is-top' : undefined}>
                  <td>{c.text}</td>
                  <td>{c.count}</td>
                  <td>{c.percent}%</td>
                  <td className="freq-bar-cell">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(c.count / max) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}