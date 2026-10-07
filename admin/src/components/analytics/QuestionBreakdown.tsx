import type { QuestionStats } from '../../types/analytics'

// Every VeggieBook question with how often each answer was picked.
//
// A book can pick several answers to one question, so each percentage is
// out of all VeggieBooks, and a question's percentages can add up to more
// than 100. The most picked answer is highlighted.

type Props = {
  questions: QuestionStats[]
  totalBooks: number
}

export function QuestionBreakdown({ questions, totalBooks }: Props) {
  if (questions.length === 0) return <p className="muted">No questions found.</p>

  return (
    <div className="question-grid">
      {questions.map((q) => {
        const top = Math.max(0, ...q.choices.map((c) => c.count))
        return (
          <section key={q.id} className="card question">
            <h3 className="question-text">{q.text}</h3>
            <p className="muted small">
              {q.code}
              {q.hidden && ' · hidden question'} · out of {totalBooks} VeggieBooks
            </p>
            <ul className="choices">
              {q.choices.map((c) => (
                <li
                  key={c.attribute}
                  className={c.count > 0 && c.count === top ? 'choice is-top' : 'choice'}
                >
                  <div className="choice-top">
                    <span>{c.text}</span>
                    <span className="choice-num">
                      {c.count} · {c.percent}%
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.min(c.percent, 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}