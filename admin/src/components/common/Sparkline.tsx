import '../../styles/charts.css'

// A small trend line with a soft fill under it and a dot on the latest
// value. The line draws itself in when it first appears.

type Props = {
  values: number[]
  width?: number
  height?: number
}

export function Sparkline({ values, width = 104, height = 40 }: Props) {
  if (values.length < 2) return null

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  const points = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 4) + 2,
    height - 3 - ((v - min) / range) * (height - 8),
  ])

  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${(width - 2).toFixed(1)} ${height} L2 ${height} Z`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path className="spark-area" d={area} />
      <path className="spark-line" d={line} pathLength={1} />
      <circle className="spark-dot" cx={lastX} cy={lastY} r={3} />
    </svg>
  )
}