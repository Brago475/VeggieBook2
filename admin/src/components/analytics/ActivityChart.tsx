import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeekActivity } from '../../types/analytics'
import { chart, tooltipStyle } from './chartTheme'

// New accounts and saved books per week, last 12 weeks. Weeks start on
// Monday.

const weekLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

type Props = {
  weeks: WeekActivity[]
}

export function ActivityChart({ weeks }: Props) {
  const data = weeks.map((w) => ({ ...w, label: weekLabel.format(new Date(w.week)) }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: chart.axis }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: chart.axis }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        <Line type="monotone" dataKey="signups" name="New accounts" stroke={chart.green} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="veggieBooks" name="VeggieBooks" stroke={chart.greenLight} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="secretsBooks" name="Secrets Books" stroke={chart.gray} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}