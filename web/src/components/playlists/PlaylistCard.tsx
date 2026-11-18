import { useEffect, useState } from 'react'
import { coverSrc } from '../../utils/coverSrc'
import { SafeImage } from '../common/SafeImage'
import { ChevronRightIcon } from '../icons/LibraryIcons'

// One playlist in the Playlists tab, styled like a book card on home: its
// recipe photos fill the card and cross-fade every 20 seconds, the name,
// label and count sit bottom left, where it came from sits top right, and
// Open sits bottom right. The whole card opens the playlist. Cards start at
// different times so they do not all change together. With reduced motion,
// or one photo, the first photo stays.

type Props = {
  name: string
  label: string
  count: string
  badge: string
  source: 'own' | 'team'
  openLabel: string
  photos: string[]
  delay: number
  onOpen: () => void
}

const SLIDE_MS = 20000

function BookIcon() {
  return (
    <svg className="book-card-count-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BadgeIcon({ source }: { source: 'own' | 'team' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {source === 'team' ? (
        <path
          d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20a2 2 0 0 0 4 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export function PlaylistCard({
  name,
  label,
  count,
  badge,
  source,
  openLabel,
  photos,
  delay,
  onOpen,
}: Props) {
  const [shown, setShown] = useState(0)
  const total = photos.length

  useEffect(() => {
    if (total < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let interval: number | undefined
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => setShown((i) => (i + 1) % total), SLIDE_MS)
    }, delay)
    return () => {
      window.clearTimeout(start)
      if (interval !== undefined) window.clearInterval(interval)
    }
  }, [total, delay])

  const active = total > 0 ? shown % total : 0

  return (
    <button type="button" className="pl-card" onClick={onOpen}>
      {total === 0 ? (
        <SafeImage className="pl-card-photo is-on" src={null} />
      ) : (
        photos.map((p, i) => (
          <SafeImage
            key={p}
            className={i === active ? 'pl-card-photo is-on' : 'pl-card-photo'}
            src={coverSrc(p)}
          />
        ))
      )}

      {total > 1 && (
        <span className="pl-card-dots" aria-hidden="true">
          {photos.map((p, i) => (
            <span key={p} className={i === active ? 'is-on' : undefined} />
          ))}
        </span>
      )}

      <span className={`pl-card-badge is-${source}`}>
        <BadgeIcon source={source} />
        {badge}
      </span>

      <span className="pl-card-text">
        <span className="book-card-name">{name}</span>
        <span className="book-card-label">{label}</span>
        <span className="book-card-count">
          <BookIcon />
          {count}
        </span>
      </span>

      <span className="pl-card-open" aria-hidden="true">
        {openLabel}
        <ChevronRightIcon className="pl-card-open-icon" />
      </span>
    </button>
  )
}