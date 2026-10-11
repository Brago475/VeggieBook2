import '../../styles/charts.css'

// A small trend line with a baseline, a soft fill under the line, and a
// dot on the latest value. The line draws itself in when it first appears.

type Props = {
  values: number[]
  width?: number
  height?: number
}

export function Sparkline({ values, width = 124, height = 50 }: Props) {
  if (values.length < 2) return null

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const base = height - 2

  const points = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 8) + 4,
    base - 2 - ((v - min) / range) * (height - 10),
  ])

  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${(width - 4).toFixed(1)} ${base} L4 ${base} Z`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <line className="spark-base" x1={0} y1={base} x2={width} y2={base} />
      <path className="spark-area" d={area} />
      <path className="spark-line" d={line} pathLength={1} />
      <circle className="spark-dot" cx={lastX} cy={lastY} r={3.5} />
    </svg>
  )
}