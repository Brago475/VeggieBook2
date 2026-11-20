import { useCallback, useEffect, useRef, useState } from 'react'
import { coverSrc } from '../../utils/coverSrc'
import { SafeImage } from '../common/SafeImage'

// A row of saved book covers in the playlist picker. One book is open at a
// time; a badge shows how many of its recipes are picked. Arrow buttons
// page through the row and show only when there is more to see that way.

export type ShelfBook = {
  id: string
  name: string
  date: string
  cover: string | null
  picked: number
}

type Props = {
  label: string
  prevLabel: string
  nextLabel: string
  books: ShelfBook[]
  active: string
  onChange: (id: string) => void
}

// How far one arrow tap moves, as a share of the visible width.
const PAGE = 0.8
// Pixels of slack so rounding never leaves an arrow showing at an end.
const EDGE = 4

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BookShelf({ label, prevLabel, nextLabel, books, active, onChange }: Props) {
  const rail = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = rail.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ left: el.scrollLeft > EDGE, right: el.scrollLeft < max - EDGE })
  }, [])

  useEffect(() => {
    measure()
    const el = rail.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    return () => watch.disconnect()
  }, [measure, books.length])

  function page(dir: 1 | -1) {
    const el = rail.current
    if (!el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * PAGE, behavior: still ? 'auto' : 'smooth' })
  }

  const wrap = ['pk-shelf-wrap', edges.left ? 'has-left' : '', edges.right ? 'has-right' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrap}>
      <div ref={rail} className="pk-shelf" role="group" aria-label={label} onScroll={measure}>
        {books.map((b) => {
          const on = b.id === active
          return (
            <button
              key={b.id}
              type="button"
              className={on ? 'pk-book is-on' : 'pk-book'}
              aria-pressed={on}
              onClick={() => onChange(b.id)}
            >
              <SafeImage className="pk-book-cover" src={b.cover ? coverSrc(b.cover) : null} />
              {b.picked > 0 && <span className="pk-book-badge">{b.picked}</span>}
              <span className="pk-book-text">
                <span className="pk-book-name">{b.name}</span>
                {b.date && <span className="pk-book-date">{b.date}</span>}
              </span>
            </button>
          )
        })}
      </div>

      {edges.left && (
        <button type="button" className="pk-arrow is-left" aria-label={prevLabel} onClick={() => page(-1)}>
          <Chevron />
        </button>
      )}
      {edges.right && (
        <button type="button" className="pk-arrow is-right" aria-label={nextLabel} onClick={() => page(1)}>
          <Chevron />
        </button>
      )}
    </div>
  )
}