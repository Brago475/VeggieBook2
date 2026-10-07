import { StatIcon, type StatIconName } from '../icons/StatIcons'

// One headline number with an icon, a label, and a line of context.

type Props = {
  icon: StatIconName
  label: string
  value: string
  detail?: string
}

export function KpiCard({ icon, label, value, detail }: Props) {
  return (
    <div className="card kpi">
      <span className="kpi-icon">
        <StatIcon name={icon} />
      </span>
      <div className="kpi-text">
        <span className="kpi-value">{value}</span>
        <span className="kpi-label">{label}</span>
        {detail && <span className="kpi-detail">{detail}</span>}
      </div>
    </div>
  )
}