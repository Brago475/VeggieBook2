import type { TopAnswer } from '../../types/admin'

// The five answers the most people picked. Each row: its rank in a circle
// (the first one solid green), the answer, the share of people who picked
// it at least once, the question number with the question's wording, a
// bar, and how many people that is.

type Props = {
  answers: TopAnswer[]
}

export function TopAnswersList({ answers }: Props) {
  if (answers.length === 0) return <p className="muted">No answers yet.</p>

  return (
    <ol className="top-answers">
      {answers.map((a, i) => (
        <li key={`${a.question}-${a.answer}`} className="top-answer">
          <span className={i === 0 ? 'top-rank is-first' : 'top-rank'} aria-label={`Number ${i + 1}`}>
            {i + 1}
          </span>
          <div className="top-answer-body">
            <div className="top-answer-line">
              <span className="top-answer-text">{a.answer}</span>
              <span className="top-answer-pct">{a.percent}%</span>
            </div>
            <span className="top-answer-q">
              <strong>{a.question}</strong> {a.questionText}
            </span>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${Math.min(a.percent, 100)}%` }} />
            </div>
          </div>
          <span className="top-answer-people">{a.people === 1 ? '1 person' : `${a.people} people`}</span>
        </li>
      ))}
    </ol>
  )
}