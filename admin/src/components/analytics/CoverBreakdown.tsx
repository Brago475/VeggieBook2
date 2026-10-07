import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { percent } from '../../utils/math'
import { imageUrl } from '../../utils/images'
import { chart, tooltipStyle } from './chartTheme'

// Built-in covers versus personal photos, with the total in the middle,
// and the most used built-in covers underneath. Personal photos are never
// shown, only counted.

type Props = {
  builtIn: number
  personal: number
  topCovers: { path: string; books: number }[]
  limit?: number
}

export function CoverBreakdown({ builtIn, personal, topCovers, limit = 8 }: Props) {
  const total = builtIn + personal
  const data = [
    { name: 'Built-in covers', value: builtIn, color: chart.deep, tone: 'is-green' },
    { name: 'Personal covers', value: personal, color: chart.gold, tone: 'is-gold' },
  ]

  if (total === 0) return <p className="muted">No books saved yet.</p>

  return (
    <div className="covers">
      <div className="covers-top">
        <div className="donut">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={104}
                paddingAngle={1.5}
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <span className="donut-value">{total}</span>
            <span className="donut-label">total covers</span>
          </div>
        </div>

        <ul className="legend-pills">
          {data.map((d) => (
            <li key={d.name} className={`legend-pill ${d.tone}`}>
              <span className="legend-dot" style={{ background: d.color }} />
              <span className="legend-name">{d.name}</span>
              <span className="legend-value">
                {d.value} ({percent(d.value, total)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>

      {topCovers.length > 0 && (
        <div className="covers-bottom">
          <h3 className="block-head">Most used covers</h3>
          <div className="cover-row">
            {topCovers.slice(0, limit).map((c) => (
              <figure
                key={c.path}
                className="cover-tile"
                title={`Used on ${c.books} ${c.books === 1 ? 'book' : 'books'}`}
              >
                <img src={imageUrl(c.path)} alt="" loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}