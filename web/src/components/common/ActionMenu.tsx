import { useEffect, useRef, useState } from 'react'

// A ⋮ button that opens a small list of actions. Used on each book card on
// the home screen, on the book card inside a saved book, and on each recipe
// or secret row inside a book.
//
// Closes when an action is picked, on a click anywhere outside, and on
// Escape, which also puts focus back on the ⋮ so keyboard users keep
// their place.
//
// Icons, drawn in the same line style:
//   trash  deleting something
//   image  changing a picture, such as a book's cover

export type ActionMenuItem = {
  label: string
  onSelect: () => void
  danger?: boolean
  icon?: 'trash' | 'image'
}

type Props = {
  // Read by screen readers, since the button itself only shows three dots.
  label: string
  items: ActionMenuItem[]
  className?: string
}

export function ActionMenu({ label, items, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return

    // First action gets focus, so Enter picks it right away.
    listRef.current?.querySelector<HTMLButtonElement>('button')?.focus()

    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={`menu ${className}`.trim()} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="menu-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <ul className="menu-list" role="menu" ref={listRef}>
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                className={`menu-item${item.danger ? ' is-danger' : ''}`}
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
              >
                {item.icon === 'trash' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                )}
                {item.icon === 'image' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="8.5" cy="9.5" r="1.5" />
                    <path d="M21 16l-5-5-9 9" />
                  </svg>
                )}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}