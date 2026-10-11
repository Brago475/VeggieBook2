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
// Green icon and label on top, with an optional chip on the right that
// compares with this week (green when something went up, gray otherwise).
// Under it the big number, an optional note, and a trend line for the last
// 8 weeks. All motion is turned off for people with reduce motion turned on.

type Props = {
  label: string
  icon: IconName
  value: number
  note?: ReactNode
  chip?: string
  chipUp?: boolean
  spark?: number[]
  index?: number
}

export function StatCard({ label, icon, value, note, chip, chipUp = false, spark, index = 0 }: Props) {
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
      <div className="stat-head">
        <span className="number-icon is-green">
          <NavIcon name={icon} size={18} />
        </span>
        <span className="stat-label">{label}</span>
        {chip && <span className={chipUp ? 'stat-chip is-up' : 'stat-chip'}>{chip}</span>}
      </div>
      <div className="stat-body">
        <div className="stat-text">
          <span className="stat-value">{shown.toLocaleString()}</span>
          {note && <span className="stat-note">{note}</span>}
        </div>
        {spark && (
          <div className="stat-trend">
            <Sparkline values={spark} />
            <span className="stat-trend-label">Last 8 weeks</span>
          </div>
        )}
      </div>
    </div>
  )
}