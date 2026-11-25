// One progress row: an amount eaten against a daily goal.

type Props = {
  label: string
  have: number
  goal: number
  text: string
  met: boolean
}

export function GroupBar({ label, have, goal, text, met }: Props) {
  const pct = goal > 0 ? Math.min(100, Math.round((have / goal) * 100)) : 0

  return (
    <li className={`st2-grow${met ? ' is-met' : ''}`}>
      <div className="st2-grow-top">
        <span className="st2-grow-name">{label}</span>
        <span className="st2-grow-text">{text}</span>
      </div>
      <div
        className="st2-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </li>
  )
}