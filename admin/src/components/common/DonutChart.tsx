import '../../styles/charts.css'

// A ring split into parts, with the total in the middle and a legend
// beside it giving each part's count and percent. Parts are drawn in the
// order given, starting at the top and going clockwise.

export type DonutPart = {
  label: string
  value: number
  color: string
}

type Props = {
  title: string
  parts: DonutPart[]
  unit: string
}

const R = 42
const CIRCLE = 2 * Math.PI * R

export function DonutChart({ title, parts, unit }: Props) {
  const total = parts.reduce((sum, p) => sum + p.value, 0)

  const arcs = parts.reduce<{ part: DonutPart; length: number; offset: number }[]>((list, part) => {
    const offset = list.length ? list[list.length - 1].offset + list[list.length - 1].length : 0
    const length = total > 0 ? (part.value / total) * CIRCLE : 0
    return [...list, { part, length, offset }]
  }, [])

  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)

  return (
    <figure className="donut">
      <figcaption className="donut-title">{title}</figcaption>
      <div className="donut-body">
        <svg className="donut-svg" viewBox="0 0 120 120" role="img" aria-label={`${title}: ${parts.map((p) => `${p.label} ${p.value}`).join(', ')}`}>
          <circle className="donut-track" cx="60" cy="60" r={R} />
          {arcs.map(({ part, length, offset }) =>
            length > 0 ? (
              <circle
                key={part.label}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={part.color}
                strokeWidth="14"
                strokeDasharray={`${length} ${CIRCLE - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            ) : null,
          )}
          <text className="donut-total" x="60" y="60">
            {total.toLocaleString()}
          </text>
          <text className="donut-unit" x="60" y="76">
            {unit}
          </text>
        </svg>
        <ul className="donut-legend">
          {parts.map((p) => (
            <li key={p.label}>
              <i style={{ background: p.color }} />
              <span className="donut-label">{p.label}</span>
              <span className="donut-count">
                {p.value.toLocaleString()} <span className="muted">({pct(p.value)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}