import type { RecentItem } from '../../types/admin'

// The latest books saved and accounts joined, newest first. People are
// shown by research ID only. Times are in Eastern time.

type Props = {
  items: RecentItem[]
}

const timeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function RecentActivity({ items }: Props) {
  if (items.length === 0) return <p className="muted">Nothing yet.</p>

  return (
    <ul className="recent">
      {items.map((item, i) => (
        <li key={`${item.researchId}-${item.at}-${i}`} className="recent-item">
          <span className={item.type === 'book' ? 'recent-dot is-book' : 'recent-dot'} aria-hidden="true" />
          <div className="recent-text">
            <span>
              <span className="id-chip">{item.researchId}</span> {item.title}
            </span>
            <span className="muted small">
              {timeFormat.format(new Date(item.at))}, {item.detail}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}