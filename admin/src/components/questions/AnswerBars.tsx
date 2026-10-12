import { shortAnswer } from '../../utils/answerNames'
import type { ChoiceShare } from './questionMath'

// Horizontal bars for a question's answer shares, highest first.

type Props = {
  items: ChoiceShare[]
  large?: boolean
}

export function AnswerBars({ items, large = false }: Props) {
  return (
    <ul className={large ? 'qa-bars is-large' : 'qa-bars'}>
      {items.map((c, i) => (
        <li key={c.attribute} title={c.text}>
          <span className="qa-bar-name">{shortAnswer(c.text)}</span>
          <span className="qa-bar-track">
            <span className={`qa-bar-fill is-${Math.min(i, 3)}`} style={{ width: `${c.percent}%` }} />
          </span>
          <span className="qa-bar-value">
            <strong>{c.percent}%</strong> <span>{c.count.toLocaleString()}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}