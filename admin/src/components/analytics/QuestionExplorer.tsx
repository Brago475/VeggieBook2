import { useState } from 'react'
import type { QuestionStats } from '../../types/analytics'
import { fillVegetable } from '../../utils/text'
import { StatIcon } from '../icons/StatIcons'

// Pick a question on the left, see its answers on the right. Percent is out
// of all VeggieBooks; a book can pick more than one answer. Only questions
// shown to users are passed in (see AnswersTab).

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

  return (
    <div className="explorer">
      <ol className="q-list">
        {questions.map((q, i) => (
          <li key={q.id}>
            <button
              type="button"
              className={q.id === selected.id ? 'q-item is-active' : 'q-item'}
              onClick={() => setSelectedId(q.id)}
            >
              <span className="q-num">{i + 1}</span>
              <span className="q-text">{fillVegetable(q.text)}</span>
              <StatIcon name="chevron" size={16} />
            </button>
          </li>
        ))}
      </ol>

      <div className="q-detail">
        <p className="eyebrow">Question {index + 1}</p>
        <h3 className="q-title">{fillVegetable(selected.text)}</h3>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Answer</th>
                <th className="num">Count</th>
                <th className="num">Percent</th>
                <th className="rate-col">Response</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.attribute} className={i === 0 && c.count > 0 ? 'is-top' : undefined}>
                  <td>{fillVegetable(c.text)}</td>
                  <td className="num">{c.count}</td>
                  <td className="num">{c.percent}%</td>
                  <td className="rate-col">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.min(c.percent, 100)}%` }} />
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