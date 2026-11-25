import { useStrings } from '../../i18n/useStrings'
import { ST_TRACKER } from '../strings/tracker'
import { addDays, dayLabel, longDate, todayKey } from '../utils/dates'

// The day being viewed, with arrows to step back and forward. Never past today.

type Props = {
  date: string
  onChange: (date: string) => void
}

export function DayNav({ date, onChange }: Props) {
  const t = useStrings(ST_TRACKER)
  const isToday = date >= todayKey()
  const label = dayLabel(date, t.locale, { today: t.today, yesterday: t.yesterday })
  const showDate = label !== longDate(date, t.locale)

  return (
    <header className="st2-daynav">
      <button
        type="button"
        className="st2-daynav-btn"
        aria-label={t.prevDay}
        onClick={() => onChange(addDays(date, -1))}
      >
        ‹
      </button>
      <div className="st2-daynav-text">
        <h1 className="library-title st2-title">{label}</h1>
        {showDate && <p className="st2-hint">{longDate(date, t.locale)}</p>}
      </div>
      <button
        type="button"
        className="st2-daynav-btn"
        aria-label={t.nextDay}
        disabled={isToday}
        onClick={() => onChange(addDays(date, 1))}
      >
        ›
      </button>
    </header>
  )
}