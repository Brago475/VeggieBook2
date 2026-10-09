import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useCountUp } from '../../hooks/useCountUp'
import { NavIcon, type IconName } from '../icons/NavIcons'
import { Sparkline } from './Sparkline'
import '../../styles/panels.css'
import '../../styles/charts.css'

// A headline number with motion, for dashboards like Overview:
//
//   - slides in on load, one card after another (index sets the delay)
//   - a soft green shine sweeps across it
//   - the number counts up from zero
//   - when the number changes on a later refresh, the card flashes green
//     and counts from the old value to the new one
//
// Same look as NumberCard (green icon, label, line, number) plus an
// optional note under the number and a trend line on the right.
// All motion is turned off for people with reduce motion turned on.

type Props = {
  label: string
  icon: IconName
  value: number
  note?: ReactNode
  spark?: number[]
  index?: number
}

export function StatCard({ label, icon, value, note, spark, index = 0 }: Props) {
  const shown = useCountUp(value)
  const [flash, setFlash] = useState(0)
  const previous = useRef<number | null>(null)

  useEffect(() => {
    if (previous.current !== null && previous.current !== value) setFlash((n) => n + 1)
    previous.current = value
  }, [value])

  const classes = ['card', 'stat-card']
  if (flash > 0) classes.push(flash % 2 === 1 ? 'is-flash-a' : 'is-flash-b')

  return (
    <div className={classes.join(' ')} style={{ animationDelay: `${index * 80}ms` }}>
      <div className="number-head">
        <span className="number-icon is-green">
          <NavIcon name={icon} size={16} />
        </span>
        <span className="number-label">{label}</span>
      </div>
      <div className="stat-body">
        <div className="stat-text">
          <span className="stat-value">{shown.toLocaleString()}</span>
          {note && <span className="stat-note">{note}</span>}
        </div>
        {spark && <Sparkline values={spark} />}
      </div>
    </div>
  )
}