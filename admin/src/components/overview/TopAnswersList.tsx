import type { TopAnswer } from '../../types/admin'

// The five answers the most people picked, each with its question number,
// a bar, and the share of people who picked it at least once.

type Props = {
  answers: TopAnswer[]
}

export function TopAnswersList({ answers }: Props) {
  if (answers.length === 0) return <p className="muted">No answers yet.</p>

  return (
    <ol className="top-answers">
      {answers.map((a) => (
        <li key={`${a.question}-${a.answer}`} className="top-answer">
          <div className="top-answer-line">
            <span className="top-answer-text">
              {a.answer}
              <span className="top-answer-q">{a.question}</span>
            </span>
            <span className="top-answer-pct">{a.percent}%</span>
          </div>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${Math.min(a.percent, 100)}%` }} />
          </div>
          <span className="muted small">
            {a.people === 1 ? '1 person' : `${a.people} people`}
          </span>
        </li>
      ))}
    </ol>
  )
}