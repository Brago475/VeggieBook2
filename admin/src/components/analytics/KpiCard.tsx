import { StatIcon, type StatIconName } from '../icons/StatIcons'

// One headline number with an icon and a label.

type Props = {
  icon: StatIconName
  label: string
  value: string
}

export function KpiCard({ icon, label, value }: Props) {
  return (
    <div className="card kpi">
      <span className="kpi-icon">
        <StatIcon name={icon} size={24} />
      </span>
      <div className="kpi-text">
        <span className="kpi-value">{value}</span>
        <span className="kpi-label">{label}</span>
      </div>
    </div>
  )
}