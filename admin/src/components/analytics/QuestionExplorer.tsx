import { useState } from 'react'
import type { QuestionStats } from '../../types/analytics'

// Pick a question on the left, see its answers on the right as a
// frequency table (answer, count, percent). Percentages are out of all
// VeggieBooks; a book can pick more than one answer.

type Props = {
  questions: QuestionStats[]
}

export function QuestionExplorer({ questions }: Props) {
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
        {questions.map((q, i) => (
          <li key={q.id}>
            <button
              type="button"
              className={q.id === selected.id ? 'explorer-item is-active' : 'explorer-item'}
              onClick={() => setSelectedId(q.id)}
            >
              <span className="explorer-num">{i + 1}</span>
              <span className="explorer-text">{q.text}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="explorer-detail">
        <h3 className="explorer-question">{selected.text}</h3>

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