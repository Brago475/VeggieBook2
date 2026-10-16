import { useState } from 'react'
import type { QuestionStats } from '../../types/analytics'
import { fillVegetable } from '../../utils/text'

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
            </button>
          </li>
        ))}
      </ol>

      <div className="q-detail">
        <h3 className="q-title">
          {index + 1}. {fillVegetable(selected.text)}
        </h3>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Answer</th>
                <th className="num">Count</th>
                <th className="num">Percent</th>
                <th className="bar-col" aria-label="Bar" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.attribute}>
                  <td>{fillVegetable(c.text)}</td>
                  <td className="num">{c.count}</td>
                  <td className={i === 0 && c.count > 0 ? 'num strong' : 'num'}>{c.percent}%</td>
                  <td className="bar-col">
                    <div className="bar">
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