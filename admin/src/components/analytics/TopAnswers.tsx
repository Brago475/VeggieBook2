import type { QuestionStats } from '../../types/analytics'
import { fillVegetable } from '../../utils/text'

// The most picked answers across every question, with the question number
// each belongs to (matching the numbered list above).

type Props = {
  questions: QuestionStats[]
  limit?: number
}

export function TopAnswers({ questions, limit = 10 }: Props) {
  const rows = questions
    .flatMap((q, i) => q.choices.map((c) => ({ ...c, question: i + 1 })))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  if (rows.length === 0) return <p className="muted">No answers yet.</p>

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="num">#</th>
            <th>Answer</th>
            <th className="num">Question</th>
            <th className="num">Count</th>
            <th className="num">Percent</th>
            <th className="bar-col" aria-label="Bar" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.attribute}>
              <td className="num">{i + 1}</td>
              <td>{fillVegetable(r.text)}</td>
              <td className="num">{r.question}</td>
              <td className="num">{r.count}</td>
              <td className="num">{r.percent}%</td>
              <td className="bar-col">
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${Math.min(r.percent, 100)}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}