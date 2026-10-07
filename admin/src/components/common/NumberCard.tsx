import '../../styles/panels.css'

// A big green number with a gray label under it. The one way every screen
// shows a headline number. "warn" turns the number orange, only for things
// that need attention.

type Props = {
  value: string
  label: string
  warn?: boolean
}

export function NumberCard({ value, label, warn = false }: Props) {
  return (
    <div className="card number-card">
      <span className={warn ? 'number-value is-warn' : 'number-value'}>{value}</span>
      <span className="number-label">{label}</span>
    </div>
  )
}