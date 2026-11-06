import { timeLabel, timeOptions } from '../../utils/calendarDates'

// A time of day in 15-minute steps, plus 11:59 PM. A saved time that is
// not on the list, such as 5:16 PM, is kept as its own choice.

type Props = {
  label: string
  value: string
  onChange: (time: string) => void
}

export function TimeSelect({ label, value, onChange }: Props) {
  const options = timeOptions()
  if (!options.includes(value)) {
    options.push(value)
    options.sort()
  }

  return (
    <label className="nt-field">
      <span className="nt-label">{label}</span>
      <select className="nt-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((t) => (
          <option key={t} value={t}>
            {timeLabel(t)}
          </option>
        ))}
      </select>
    </label>
  )
}