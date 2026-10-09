import type { WeekCount } from '../../types/admin'

// Books saved per week as stacked bars: VeggieBooks in dark gray at the
// bottom, Secrets Books in light gray on top. The total sits above each bar
// and the week's Monday under it. The current week is the last bar.

type Props = {
  weeks: WeekCount[]
}

const CHART_HEIGHT = 160

function weekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function WeeklyBooks({ weeks }: Props) {
  const max = Math.max(1, ...weeks.map((w) => w.veggie + w.secrets))
  const empty = weeks.every((w) => w.veggie + w.secrets === 0)

  if (empty) return <p className="muted">No books saved in the last {weeks.length} weeks.</p>

  return (
    <div className="weekly">
      <div className="weekly-bars" style={{ height: CHART_HEIGHT + 24 }}>
        {weeks.map((w, i) => {
          const total = w.veggie + w.secrets
          const last = i === weeks.length - 1
          return (
            <div
              key={w.weekStart}
              className="weekly-col"
              title={`Week of ${weekLabel(w.weekStart)}: ${w.veggie} VeggieBooks, ${w.secrets} Secrets Books`}
            >
              <span className={last ? 'weekly-total is-current' : 'weekly-total'}>{total}</span>
              <div className="weekly-stack">
                <div className="weekly-secrets" style={{ height: (w.secrets / max) * CHART_HEIGHT }} />
                <div className="weekly-veggie" style={{ height: (w.veggie / max) * CHART_HEIGHT }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="weekly-labels">
        {weeks.map((w, i) => (
          <span key={w.weekStart} className={i === weeks.length - 1 ? 'is-current' : undefined}>
            {weekLabel(w.weekStart)}
          </span>
        ))}
      </div>
      <div className="weekly-legend">
        <span>
          <i className="swatch is-veggie" /> VeggieBooks
        </span>
        <span>
          <i className="swatch is-secrets" /> Secrets Books
        </span>
      </div>
    </div>
  )
}