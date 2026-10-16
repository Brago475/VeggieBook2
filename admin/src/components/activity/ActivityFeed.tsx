import type { ActivityEvent } from '../../types/activity'
import { ActivityIcon } from './ActivityIcon'
import { dayLabel, localDate, timeLabel } from './activityFormat'

// Activity events grouped by local day, newest first.

type Props = {
  events: ActivityEvent[]
}

export function ActivityFeed({ events }: Props) {
  const days: { date: string; items: ActivityEvent[] }[] = []
  for (const e of events) {
    const date = localDate(e.at)
    const last = days[days.length - 1]
    if (last && last.date === date) last.items.push(e)
    else days.push({ date, items: [e] })
  }

  return (
    <div className="av-feed">
      {days.map((d) => (
        <section key={d.date} aria-label={dayLabel(d.date)}>
          <div className="av-day">
            <strong>{dayLabel(d.date)}</strong>
            <span>{d.items.length === 1 ? '1 event' : `${d.items.length} events`}</span>
          </div>
          <ul className="av-list">
            {d.items.map((e, i) => (
              <li key={`${e.at}-${e.type}-${i}`} className="av-row">
                <ActivityIcon type={e.type} />
                <span className={e.researchId ? 'av-id' : 'av-id is-admin'}>{e.researchId ?? 'Admin'}</span>
                <span className="av-text">
                  <strong>{e.title}</strong>
                  <span>{e.detail}</span>
                </span>
                <time className="av-time" dateTime={e.at}>
                  {timeLabel(e.at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}