import { addDays, addMonths, longDateTime, sameDay, spanText, startOfDay, zoneName } from '../../utils/calendarDates'
import { StudyIcon } from '../studies/StudyIcons'
import { DateCalendar } from './DateCalendar'
import { endAt, startAt, startPassed, type Schedule } from './schedule'
import { TimeSelect } from './TimeSelect'
import '../../styles/notification-schedule.css'

// The editor's When sections: when it starts (Send now, Schedule, or the
// kept start of a message that already started), when it ends (quick
// choices plus a calendar), repeat, and a summary of what will happen.

type Props = {
  value: Schedule
  onChange: (next: Schedule) => void
  now: Date
  // The start of a message that already started.
  fixedStart: Date | null
}

const QUICK = [
  { label: '1 week', pick: (d: Date) => addDays(d, 7) },
  { label: '2 weeks', pick: (d: Date) => addDays(d, 14) },
  { label: '1 month', pick: (d: Date) => addMonths(d, 1) },
]

export function ScheduleSection({ value: s, onChange, now, fixedStart }: Props) {
  const set = (patch: Partial<Schedule>) => onChange({ ...s, ...patch })
  const today = startOfDay(now)
  const passed = startPassed(s, now)
  const start = startAt(s, now, fixedStart)
  const end = endAt(s)

  const scheduledDay = s.startMode === 'later' && s.startDay && !passed ? s.startDay : null
  const quickBase = scheduledDay ?? today
  const endMin = scheduledDay ?? today
  const rangeFrom = scheduledDay ?? (s.startMode === 'fixed' && fixedStart ? startOfDay(fixedStart) : today)

  const startsNow = s.startMode === 'now' || passed
  const startText =
    s.startMode === 'fixed' && fixedStart
      ? `Started ${longDateTime(fixedStart)}`
      : startsNow
        ? 'Starts the moment you click Send'
        : start
          ? `Starts ${longDateTime(start)}`
          : 'Pick a start day'
  const bad = start !== null && end !== null && end <= start
  const repeatDays = Number(s.repeatDays)

  return (
    <>
      <section className="st-dialog-section nt-section">
        <span className="st-section-title">When it starts</span>

        {s.startMode === 'fixed' && fixedStart ? (
          <p className="nt-fixed">
            Started {longDateTime(fixedStart)}. Its start stays the same so its numbers do not reset. To run it
            again on new dates, use Send again.
          </p>
        ) : (
          <div className="nt-choice-row">
            <label className={s.startMode === 'now' ? 'nt-choice is-on' : 'nt-choice'}>
              <input type="radio" name="nt-start" checked={s.startMode === 'now'} onChange={() => set({ startMode: 'now' })} />
              <span>
                <strong>Send now</strong>
                <span>Goes out the moment you click Send. The server sets the time.</span>
              </span>
            </label>
            <label className={s.startMode === 'later' ? 'nt-choice is-on' : 'nt-choice'}>
              <input
                type="radio"
                name="nt-start"
                checked={s.startMode === 'later'}
                onChange={() => set({ startMode: 'later', startDay: s.startDay ?? today })}
              />
              <span>
                <strong>Schedule</strong>
                <span>Pick a day and time on the calendar.</span>
              </span>
            </label>
          </div>
        )}

        {s.startMode === 'later' && (
          <div className="nt-cal-row">
            <DateCalendar label="Start day" value={s.startDay} min={today} onChange={(d) => set({ startDay: d })} />
            <div className="nt-cal-side">
              <TimeSelect label="Starts at" value={s.startTime} onChange={(t) => set({ startTime: t })} />
              <span className="nt-hint">Times are in {zoneName() || 'your computer’s time zone'}.</span>
            </div>
          </div>
        )}

        {passed && (
          <p className="nt-warn" role="status">
            <StudyIcon name="alert" size={16} />
            The start you picked has passed. It will go out as soon as you click Send.
          </p>
        )}
      </section>

      <section className="st-dialog-section nt-section">
        <span className="st-section-title">When it ends</span>

        <div className="nt-presets">
          {QUICK.map((q) => {
            const day = q.pick(quickBase)
            const on = sameDay(day, s.endDay)
            return (
              <button
                key={q.label}
                type="button"
                className={on ? 'nt-chip is-on' : 'nt-chip'}
                aria-pressed={on}
                onClick={() => set({ endDay: day })}
              >
                {q.label}
              </button>
            )
          })}
        </div>

        <div className="nt-cal-row">
          <DateCalendar
            label="End day"
            value={s.endDay}
            min={endMin}
            rangeFrom={rangeFrom}
            onChange={(d) => set({ endDay: d })}
          />
          <div className="nt-cal-side">
            <TimeSelect label="Ends at" value={s.endTime} onChange={(t) => set({ endTime: t })} />
            <label className="nt-check">
              <input type="checkbox" checked={s.repeatOn} onChange={(e) => set({ repeatOn: e.target.checked })} />
              <span>Show it again every</span>
              <input
                className="nt-input nt-days"
                type="number"
                min={1}
                max={365}
                value={s.repeatDays}
                disabled={!s.repeatOn}
                onChange={(e) => set({ repeatDays: e.target.value })}
                aria-label="Days between showings"
              />
              <span>days</span>
            </label>
          </div>
        </div>
      </section>

      <section className={bad ? 'nt-summary is-bad' : 'nt-summary'} aria-live="polite">
        <StudyIcon name={bad ? 'alert' : 'signal'} size={18} />
        <div>
          <strong>
            {bad
              ? 'The end must be after the start'
              : start && end
                ? `Live for ${spanText(end.getTime() - start.getTime())}`
                : 'Pick an end day'}
          </strong>
          <span>
            {startText}
            {end ? ` and ends ${longDateTime(end)}.` : '.'}
            {s.repeatOn && Number.isInteger(repeatDays) && repeatDays > 0
              ? ` It shows again every ${repeatDays} ${repeatDays === 1 ? 'day' : 'days'} until then.`
              : ''}
          </span>
        </div>
      </section>
    </>
  )
}