import { useStrings } from '../../i18n/useStrings'
import { ST_TODAY } from '../strings/today'
import { servings, tenth } from '../utils/format'

// Servings eaten today against the daily vegetable goal.

type Props = {
  have: number
  goal: number
}

export function VegetableProgress({ have, goal }: Props) {
  const t = useStrings(ST_TODAY)
  const pct = goal > 0 ? Math.min(100, Math.round((have / goal) * 100)) : 0
  const left = Math.max(0, goal - have)

  return (
    <section className="st2-progress">
      <div className="st2-progress-top">
        <span className="st2-group-name">{t.vegetables}</span>
        <span className="st2-group-amount">
          {tenth(have)} {t.of} {servings(goal)} {t.servingsWord}
        </span>
      </div>
      <div
        className="st2-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={t.vegetables}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="st2-hint">
        {left > 0 ? `${tenth(left)} ${t.servingsWord} ${t.toGo}` : t.goalMet}
      </p>
    </section>
  )
}