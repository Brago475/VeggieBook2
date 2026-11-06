import { useEffect, useState } from 'react'
import { monthCells, sameDay, startOfDay } from '../../utils/calendarDates'

// A month calendar for picking one day. Month and year jump from the
// dropdowns or step with the arrows. Days before `min` cannot be picked.
// With `rangeFrom`, the days from it to the picked day are shaded.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const YEARS_AHEAD = 5

type Props = {
  label: string
  value: Date | null
  min: Date
  rangeFrom?: Date | null
  onChange: (day: Date) => void
}

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={back ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

export function DateCalendar({ label, value, min, rangeFrom = null, onChange }: Props) {
  const minDay = startOfDay(min)
  const [view, setView] = useState(() => {
    const base = value ?? minDay
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  // Follows a day set from outside, such as a quick choice.
  const valueTime = value ? value.getTime() : null
  useEffect(() => {
    if (valueTime === null) return
    const d = new Date(valueTime)
    setView(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [valueTime])

  const today = startOfDay(new Date())
  const year = view.getFullYear()
  const month = view.getMonth()
  const cells = monthCells(year, month)
  const canGoBack = new Date(year, month, 1) > new Date(minDay.getFullYear(), minDay.getMonth(), 1)

  const firstYear = Math.min(minDay.getFullYear(), year)
  const years = Array.from(
    { length: Math.max(year, minDay.getFullYear() + YEARS_AHEAD) - firstYear + 1 },
    (_, i) => firstYear + i,
  )

  function dayClass(day: Date): string {
    const classes = ['nt-cal-day']
    if (sameDay(day, today)) classes.push('is-today')
    if (sameDay(day, value)) classes.push('is-picked')
    else if (rangeFrom && value && day >= startOfDay(rangeFrom) && day < value) classes.push('is-range')
    if (rangeFrom && sameDay(day, rangeFrom) && !sameDay(day, value)) classes.push('is-from')
    return classes.join(' ')
  }

  return (
    <div className="nt-cal" role="group" aria-label={label}>
      <div className="nt-cal-head">
        <button
          type="button"
          className="nt-cal-nav"
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => setView(new Date(year, month - 1, 1))}
        >
          <Chevron back />
        </button>
        <select
          className="nt-cal-select"
          aria-label="Month"
          value={month}
          onChange={(e) => setView(new Date(year, Number(e.target.value), 1))}
        >
          {MONTHS.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="nt-cal-select"
          aria-label="Year"
          value={year}
          onChange={(e) => setView(new Date(Number(e.target.value), month, 1))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="nt-cal-nav"
          aria-label="Next month"
          onClick={() => setView(new Date(year, month + 1, 1))}
        >
          <Chevron />
        </button>
      </div>

      <div className="nt-cal-grid">
        {WEEKDAYS.map((d) => (
          <span key={d} className="nt-cal-dow">
            {d}
          </span>
        ))}
        {cells.map((day, i) =>
          day === null ? (
            <span key={`blank-${i}`} />
          ) : (
            <button
              key={day.getTime()}
              type="button"
              className={dayClass(day)}
              disabled={day < minDay}
              aria-pressed={sameDay(day, value)}
              aria-label={day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              onClick={() => onChange(day)}
            >
              {day.getDate()}
            </button>
          ),
        )}
      </div>
    </div>
  )
}