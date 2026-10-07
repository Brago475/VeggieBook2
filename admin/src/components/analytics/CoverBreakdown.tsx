import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { imageUrl } from '../../utils/images'
import { chart, tooltipStyle } from './chartTheme'

// Built-in covers versus personal photos, and the most used built-in
// covers. Personal photos are never shown, only counted.

type Props = {
  builtIn: number
  personal: number
  topCovers: { path: string; books: number }[]
}

export function CoverBreakdown({ builtIn, personal, topCovers }: Props) {
  const total = builtIn + personal
  const data = [
    { name: 'Built-in covers', value: builtIn, color: chart.deep },
    { name: 'Personal covers', value: personal, color: chart.gold },
  ]

  if (total === 0) return <p className="muted">No books saved yet.</p>

  return (
    <div className="covers">
      <div className="covers-donut">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="legend">
          {data.map((d) => (
            <li key={d.name}>
              <span className="legend-dot" style={{ background: d.color }} />
              {d.name}
              <strong>
                {d.value} ({Math.round((d.value / total) * 100)}%)
              </strong>
            </li>
          ))}
        </ul>
      </div>

      {topCovers.length > 0 && (
        <div>
          <h4 className="subhead">Most used built-in covers</h4>
          <div className="cover-grid">
            {topCovers.map((c) => (
              <figure key={c.path} className="cover-tile">
                <img src={imageUrl(c.path)} alt="" loading="lazy" />
                <figcaption>{c.books}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}