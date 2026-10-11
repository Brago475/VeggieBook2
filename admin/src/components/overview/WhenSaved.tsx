// When books are saved: a grid of day of week (rows, Monday first) by
// 3-hour block of the day (columns, midnight first), in Eastern time.
//
//   - a line on top names the busiest time
//   - each cell shows its count; darker green means more books, and the
//     busiest cell has an orange outline
//   - the last column is each day's total with a small bar
//   - a Fewer to More key underneath
//
// On a phone the grid scrolls sideways instead of crushing its labels.

type Props = {
  heat: number[][]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const BLOCKS = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM']
const RANGES = [
  '12 AM to 3 AM',
  '3 AM to 6 AM',
  '6 AM to 9 AM',
  '9 AM to 12 PM',
  '12 PM to 3 PM',
  '3 PM to 6 PM',
  '6 PM to 9 PM',
  '9 PM to 12 AM',
]

const books = (n: number) => (n === 1 ? '1 book' : `${n.toLocaleString()} books`)

function level(value: number, max: number): number {
  if (value === 0 || max === 0) return 0
  return Math.max(1, Math.ceil((value / max) * 5))
}

function busiestLine(heat: number[][], max: number): string {
  const spots: { day: number; block: number }[] = []
  heat.forEach((row, day) =>
    row.forEach((v, block) => {
      if (v === max) spots.push({ day, block })
    }),
  )
  const first = spots[0]
  const where = `${DAYS[first.day]}, ${RANGES[first.block]}`
  if (spots.length === 1) return `${where}, with ${books(max)}`
  const others = spots.length - 1
  return `${where}, tied with ${others} other ${others === 1 ? 'time' : 'times'} at ${books(max)} each`
}

export function WhenSaved({ heat }: Props) {
  const max = Math.max(0, ...heat.flat())

  if (max === 0) return <p className="muted">No books saved yet.</p>

  const dayTotals = heat.map((row) => row.reduce((a, b) => a + b, 0))
  const maxDay = Math.max(1, ...dayTotals)

  return (
    <div className="heat">
      <p className="heat-busiest">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <span>
          Busiest time: <strong>{busiestLine(heat, max)}</strong>
        </span>
      </p>

      <div className="heat-scroll">
        <div className="heat-grid" role="table" aria-label="Books saved by day and time, Eastern">
          <span role="columnheader" />
          {BLOCKS.map((b) => (
            <span key={b} className="heat-col" role="columnheader">
              {b}
            </span>
          ))}
          <span className="heat-col is-total" role="columnheader">
            Total
          </span>

          {heat.map((row, d) => (
            <div key={DAYS[d]} className="heat-row" role="row">
              <span className="heat-day" role="rowheader">
                {DAYS[d]}
              </span>
              {row.map((v, b) => {
                const lvl = level(v, max)
                const classes = ['heat-cell', `level-${lvl}`]
                if (v === max) classes.push('is-top')
                return (
                  <span
                    key={b}
                    role="cell"
                    className={classes.join(' ')}
                    style={{ animationDelay: `${(d * 8 + b) * 12}ms` }}
                    title={`${DAYS[d]}, ${RANGES[b]}: ${books(v)}`}
                  >
                    {v > 0 ? v : ''}
                  </span>
                )
              })}
              <span className="heat-total" role="cell">
                <i style={{ width: `${(dayTotals[d] / maxDay) * 36}px` }} aria-hidden="true" />
                {dayTotals[d]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="heat-legend" aria-hidden="true">
        Fewer
        {[0, 2, 3, 4, 5].map((l) => (
          <span key={l} className={`heat-key level-${l}`} />
        ))}
        More
      </div>
    </div>
  )
}