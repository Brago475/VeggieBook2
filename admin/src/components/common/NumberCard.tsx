import { NavIcon, type IconName } from '../icons/NavIcons'
import '../../styles/panels.css'

// A headline number: a header strip with an optional icon and the label,
// then the number in large dark type. The one way every screen shows a
// headline number.
//
// "tone" gives the icon a soft tint (green, blue, amber, or violet); use a
// different one per card in a row. "warn" turns the number orange, only
// for things that need attention.

export type Tone = 'green' | 'blue' | 'amber' | 'violet'

type Props = {
  value: string
  label: string
  icon?: IconName
  tone?: Tone
  warn?: boolean
}

export function NumberCard({ value, label, icon, tone, warn = false }: Props) {
  return (
    <div className="card number-card">
      <div className="number-head">
        {icon && (
          <span className={tone ? `number-icon is-${tone}` : 'number-icon'}>
            <NavIcon name={icon} size={16} />
          </span>
        )}
        <span className="number-label">{label}</span>
      </div>
      <span className={warn ? 'number-value is-warn' : 'number-value'}>{value}</span>
    </div>
  )
}