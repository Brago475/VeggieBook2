// When books are saved: a grid of day of week (rows, Monday first) by
// 3-hour block of the day (columns, midnight first), in Eastern time.
// Each column is labeled with its time range. Darker green means more
// books. Hover a cell for its count.

type Props = {
  heat: number[][]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BLOCKS = ['12-3 AM', '3-6 AM', '6-9 AM', '9 AM-12', '12-3 PM', '3-6 PM', '6-9 PM', '9 PM-12']
const BLOCK_NAMES = [
  'midnight to 3 AM',
  '3 to 6 AM',
  '6 to 9 AM',
  '9 AM to noon',
  'noon to 3 PM',
  '3 to 6 PM',
  '6 to 9 PM',
  '9 PM to midnight',
]

function level(value: number, max: number): number {
  if (value === 0 || max === 0) return 0
  return Math.max(1, Math.ceil((value / max) * 5))
}

export function WhenSaved({ heat }: Props) {
  const max = Math.max(0, ...heat.flat())

  if (max === 0) return <p className="muted">No books saved yet.</p>

  return (
    <div className="heat">
      <div className="heat-grid" role="table" aria-label="Books saved by day and time">
        <span role="columnheader" />
        {BLOCKS.map((b) => (
          <span key={b} className="heat-col" role="columnheader">
            {b}
          </span>
        ))}
        {heat.map((row, d) => (
          <div key={DAYS[d]} className="heat-row" role="row">
            <span className="heat-day" role="rowheader">
              {DAYS[d]}
            </span>
            {row.map((v, b) => (
              <span
                key={b}
                role="cell"
                className={`heat-cell level-${level(v, max)}`}
                style={{ animationDelay: `${(d * 8 + b) * 12}ms` }}
                title={`${DAYS[d]}, ${BLOCK_NAMES[b]}: ${v === 1 ? '1 book' : `${v} books`}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heat-legend">
        Fewer
        {[0, 1, 2, 3, 4, 5].map((l) => (
          <span key={l} className={`heat-cell level-${l}`} />
        ))}
        More
      </div>
    </div>
  )
}