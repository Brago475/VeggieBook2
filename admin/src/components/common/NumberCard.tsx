import { NavIcon, type IconName } from '../icons/NavIcons'
import '../../styles/panels.css'

// A headline number: a header strip with an optional icon and the label,
// then the number in large dark type. The one way every screen shows a
// headline number. "warn" turns the number orange, only for things that
// need attention.

type Props = {
  value: string
  label: string
  icon?: IconName
  warn?: boolean
}

export function NumberCard({ value, label, icon, warn = false }: Props) {
  return (
    <div className="card number-card">
      <div className="number-head">
        {icon && (
          <span className="number-icon">
            <NavIcon name={icon} size={16} />
          </span>
        )}
        <span className="number-label">{label}</span>
      </div>
      <span className={warn ? 'number-value is-warn' : 'number-value'}>{value}</span>
    </div>
  )
}