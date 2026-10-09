import { useEffect, useRef, useState } from 'react'
import type { RecentItem } from '../../types/admin'
import '../../styles/recent.css'

// The latest activity, newest first, by research ID only, in Eastern time.
// The dot's color says what happened:
//
//   green   a book saved
//   blue    a new account
//   orange  a book deleted
//   red     an account deleted
//
// Lines that appear on a later refresh slide in at the top with a quick
// green highlight. Nothing flashes on the first load.

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

const dotClass: Record<RecentItem['type'], string> = {
  book: 'is-saved',
  joined: 'is-joined',
  book_deleted: 'is-book-deleted',
  account_deleted: 'is-account-deleted',
}

const keyOf = (item: RecentItem) => `${item.type}|${item.researchId}|${item.at}`

export function RecentActivity({ items }: Props) {
  const seen = useRef<Set<string> | null>(null)
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const signature = items.map(keyOf).join(',')

  useEffect(() => {
    const keys = signature ? signature.split(',') : []
    if (seen.current) {
      const previous = seen.current
      setFresh(new Set(keys.filter((k) => !previous.has(k))))
    }
    seen.current = new Set(keys)
  }, [signature])

  if (items.length === 0) return <p className="muted">Nothing yet.</p>

  return (
    <ul className="recent">
      {items.map((item) => {
        const key = keyOf(item)
        return (
          <li key={key} className={fresh.has(key) ? 'recent-item is-new' : 'recent-item'}>
            <span className={`recent-dot ${dotClass[item.type]}`} aria-hidden="true" />
            <div className="recent-text">
              <span>
                <span className="id-chip">{item.researchId}</span> {item.title}
              </span>
              <span className="muted small">
                {timeFormat.format(new Date(item.at))}, {item.detail}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}