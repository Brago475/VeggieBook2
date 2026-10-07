import type { QuestionStats } from '../../types/analytics'
import { fillVegetable } from '../../utils/text'

// The most picked answers across every question, with the question number
// each one belongs to (matching the numbers in the question list above).

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
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th className="rank-col">#</th>
            <th>Answer</th>
            <th className="num">Question</th>
            <th className="num">Count</th>
            <th className="num">Percent</th>
            <th className="rate-col">Response</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.attribute}>
              <td className="rank-col">
                <span className="rank">{i + 1}</span>
              </td>
              <td>{fillVegetable(r.text)}</td>
              <td className="num">{r.question}</td>
              <td className="num">{r.count}</td>
              <td className="num">{r.percent}%</td>
              <td className="rate-col">
                <div className="bar-track">
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