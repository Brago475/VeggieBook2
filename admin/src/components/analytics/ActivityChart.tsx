import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeekActivity } from '../../types/analytics'
import { chart, tooltipStyle } from './chartTheme'

// New accounts and saved books per week. Weeks start on Monday.

const weekLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

type Props = {
  weeks: WeekActivity[]
}

export function ActivityChart({ weeks }: Props) {
  const data = weeks.map((w) => ({ ...w, label: weekLabel.format(new Date(w.week)) }))

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: chart.axis }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: chart.axis }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Area
            type="monotone"
            dataKey="signups"
            name="New accounts"
            stroke={chart.deep}
            fill={chart.deep}
            fillOpacity={0.12}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="veggieBooks"
            name="VeggieBooks saved"
            stroke={chart.light}
            fill={chart.light}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="secretsBooks"
            name="Secrets Books saved"
            stroke={chart.gold}
            fill={chart.gold}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}