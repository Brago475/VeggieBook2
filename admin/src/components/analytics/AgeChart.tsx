import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chart, tooltipStyle } from './chartTheme'

// Accounts by the age range picked at sign-up.

type Props = {
  ageRanges: { label: string; accounts: number }[]
}

export function AgeChart({ ageRanges }: Props) {
  if (ageRanges.length === 0) return <p className="muted">No accounts yet.</p>

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={ageRanges} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: chart.axis }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: chart.axis }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: chart.grid }} />
        <Bar dataKey="accounts" name="Accounts" fill={chart.green} radius={[4, 4, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  )
}