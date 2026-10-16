import { useEffect, useRef, useState } from 'react'
import type { RecentItem } from '../../types/admin'
import { NavIcon, type IconName } from '../icons/NavIcons'
import '../../styles/recent.css'

// The latest activity, newest first, by research ID only, in Eastern time.
// Each line: a round icon for what happened, the title, the research ID
// with the detail under it, and the date and time on the right.
//
//   green book        a VeggieBook saved
//   violet open book  a Secrets Book saved
//   blue person       a new account
//   orange x          a book deleted
//   red x             an account deleted
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

type Look = { tone: string; icon: IconName }

function lookOf(item: RecentItem): Look {
  switch (item.type) {
    case 'book':
      return /secret/i.test(`${item.title} ${item.detail}`)
        ? { tone: 'is-secrets', icon: 'content' }
        : { tone: 'is-saved', icon: 'book' }
    case 'joined':
      return { tone: 'is-joined', icon: 'users' }
    case 'book_deleted':
      return { tone: 'is-book-deleted', icon: 'close' }
    case 'account_deleted':
      return { tone: 'is-account-deleted', icon: 'close' }
  }
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
        const look = lookOf(item)
        return (
          <li key={key} className={fresh.has(key) ? 'recent-item is-new' : 'recent-item'}>
            <span className={`recent-icon ${look.tone}`} aria-hidden="true">
              <NavIcon name={look.icon} size={16} />
            </span>
            <div className="recent-text">
              <span className="recent-title">{item.title}</span>
              <span className="recent-detail">
                <span className="id-chip">{item.researchId}</span>
                {item.detail && <span className="recent-detail-text">{item.detail}</span>}
              </span>
            </div>
            <time className="recent-time" dateTime={item.at}>
              {timeFormat.format(new Date(item.at))}
            </time>
          </li>
        )
      })}
    </ul>
  )
}