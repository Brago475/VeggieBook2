// A time of day as Hour, Minute and an AM / PM switch, instead of one long
// list. Minutes come in 15-minute steps; a saved time with another minute,
// such as 5:16 PM or 11:59 PM, keeps it as an extra choice. With endOfDay,
// a shortcut sets 11:59 PM.

type Props = {
  label: string
  // "HH:mm", 24-hour
  value: string
  onChange: (time: string) => void
  endOfDay?: boolean
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = ['00', '15', '30', '45']
const END_OF_DAY = '23:59'

const pad = (n: number) => String(n).padStart(2, '0')

function split(value: string) {
  const [h, m] = value.split(':').map(Number)
  return { hour12: h % 12 === 0 ? 12 : h % 12, minute: pad(m), pm: h >= 12 }
}

function join(hour12: number, minute: string, pm: boolean): string {
  const h = (hour12 % 12) + (pm ? 12 : 0)
  return `${pad(h)}:${minute}`
}

export function TimeSelect({ label, value, onChange, endOfDay = false }: Props) {
  const { hour12, minute, pm } = split(value)
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort()

  return (
    <div className="nt-field">
      <span className="nt-label">{label}</span>
      <div className="nt-time" role="group" aria-label={label}>
        <select
          className="nt-time-part"
          aria-label="Hour"
          value={hour12}
          onChange={(e) => onChange(join(Number(e.target.value), minute, pm))}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="nt-time-colon" aria-hidden="true">
          :
        </span>
        <select
          className="nt-time-part"
          aria-label="Minute"
          value={minute}
          onChange={(e) => onChange(join(hour12, e.target.value, pm))}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="nt-ampm">
          <button
            type="button"
            aria-pressed={!pm}
            className={pm ? 'nt-ampm-btn' : 'nt-ampm-btn is-on'}
            onClick={() => onChange(join(hour12, minute, false))}
          >
            AM
          </button>
          <button
            type="button"
            aria-pressed={pm}
            className={pm ? 'nt-ampm-btn is-on' : 'nt-ampm-btn'}
            onClick={() => onChange(join(hour12, minute, true))}
          >
            PM
          </button>
        </div>
      </div>
      {endOfDay && (
        <button
          type="button"
          className={value === END_OF_DAY ? 'nt-chip is-small is-on' : 'nt-chip is-small'}
          aria-pressed={value === END_OF_DAY}
          onClick={() => onChange(END_OF_DAY)}
        >
          End of day (11:59 PM)
        </button>
      )}
    </div>
  )
}