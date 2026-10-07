import type { QuestionStats } from '../../types/analytics'

// The most picked answers across every question, with the question each
// one belongs to.

type Props = {
  questions: QuestionStats[]
  limit?: number
}

export function TopAnswers({ questions, limit = 10 }: Props) {
  const rows = questions
    .flatMap((q, i) => q.choices.map((c) => ({ ...c, question: `Q${i + 1}` })))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  if (rows.length === 0) return <p className="muted">No answers yet.</p>

  return (
    <div className="stats-wrap">
      <table className="freq-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Answer</th>
            <th>Question</th>
            <th>Count</th>
            <th>Percent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.attribute}>
              <td>{i + 1}</td>
              <td>{r.text}</td>
              <td>{r.question}</td>
              <td>{r.count}</td>
              <td>{r.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}