import { useState } from 'react'
import type { WeekCount } from '../../types/admin'

// Books saved per week as stacked bars: VeggieBooks in green at the bottom,
// Secrets Books in violet on top, with:
//
//   - a scale on the left and light grid lines across
//   - a dashed orange line for the weekly average
//   - the total above each bar (bold when above zero)
//   - the busiest week on a soft green background, and the current week
//     labeled "This week" in blue on a soft blue background
//   - hovering (or tabbing to) a week shows its dates and the split
//
// WeeklyLegend shows the two totals as chips, for the panel's title row.

type Props = {
  weeks: WeekCount[]
}

const PLOT = 200 // height of the tallest possible bar, in px
const ROOM = 28 // space above the plot for the totals

function parseDay(weekStart: string): Date {
  const [y, m, d] = weekStart.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const short = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function weekRange(weekStart: string): string {
  const start = parseDay(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${short(start)} to ${short(end)}`
}

// A scale of 4 steps that fits the busiest week: 0-4, 0-8, 0-12, and so on.
function scale(max: number): number[] {
  const step = Math.max(1, Math.ceil(max / 4))
  return [0, 1, 2, 3, 4].map((i) => i * step)
}

const oneDecimal = (n: number) => String(Math.round(n * 10) / 10)

export function WeeklyBooks({ weeks }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const totals = weeks.map((w) => w.veggie + w.secrets)
  const max = Math.max(0, ...totals)

  if (max === 0) return <p className="muted">No books saved in the last {weeks.length} weeks.</p>

  const ticks = scale(max)
  const top = ticks[ticks.length - 1]
  const px = (n: number) => (n / top) * PLOT
  const average = totals.reduce((a, b) => a + b, 0) / weeks.length
  const last = weeks.length - 1

  return (
    <div className="weekly">
      <div className="weekly-plot">
        <div className="weekly-axis" style={{ height: PLOT + ROOM }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ bottom: px(t) - 7 }}>
              {t}
            </span>
          ))}
        </div>

        <div className="weekly-area" style={{ height: PLOT + ROOM }}>
          {ticks.map((t) => (
            <span key={t} className={t === 0 ? 'weekly-grid is-base' : 'weekly-grid'} style={{ bottom: px(t) }} />
          ))}

          {average > 0 && (
            <>
              <span className="weekly-average" style={{ bottom: px(average) }} />
              <span className="weekly-average-label" style={{ bottom: px(average) + 4 }}>
                Average {oneDecimal(average)} a week
              </span>
            </>
          )}

          <div className="weekly-bars">
            {weeks.map((w, i) => {
              const total = totals[i]
              const classes = ['weekly-col']
              if (i === last) classes.push('is-current')
              else if (total === max) classes.push('is-peak')
              return (
                <div
                  key={w.weekStart}
                  className={classes.join(' ')}
                  tabIndex={0}
                  aria-label={`${weekRange(w.weekStart)}: ${w.veggie} VeggieBooks, ${w.secrets} Secrets Books`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                >
                  <span className={total > 0 ? 'weekly-total has-books' : 'weekly-total'}>{total}</span>
                  <div className="weekly-stack" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="weekly-secrets" style={{ height: px(w.secrets) }} />
                    <div className={w.secrets ? 'weekly-veggie' : 'weekly-veggie is-top'} style={{ height: px(w.veggie) }} />
                  </div>
                </div>
              )
            })}
          </div>

          {hovered !== null && (
            <div
              className={`weekly-tip${hovered === 0 ? ' is-start' : ''}${hovered >= last - 1 ? ' is-end' : ''}`}
              style={{ left: `${((hovered + 0.5) / weeks.length) * 100}%` }}
              role="tooltip"
            >
              <strong>{weekRange(weeks[hovered].weekStart)}</strong>
              <span>
                VeggieBooks <b>{weeks[hovered].veggie}</b>
              </span>
              <span>
                Secrets Books <b>{weeks[hovered].secrets}</b>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="weekly-labels">
        {weeks.map((w, i) => (
          <span key={w.weekStart} className={i === last ? 'is-current' : undefined}>
            {i === last ? 'This week' : short(parseDay(w.weekStart))}
          </span>
        ))}
      </div>
    </div>
  )
}

type LegendProps = {
  veggie: number
  secrets: number
}

export function WeeklyLegend({ veggie, secrets }: LegendProps) {
  return (
    <div className="weekly-legend">
      <span className="weekly-chip is-veggie">
        <i aria-hidden="true" />
        VeggieBooks <strong>{veggie.toLocaleString()}</strong>
      </span>
      <span className="weekly-chip is-secrets">
        <i aria-hidden="true" />
        Secrets Books <strong>{secrets.toLocaleString()}</strong>
      </span>
    </div>
  )
}