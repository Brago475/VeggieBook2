import { useEffect, useRef, useState } from 'react'
import { NavIcon, type IconName } from '../icons/NavIcons'

// The ⋮ button on a card and its small menu. Closes on a pick, a click
// outside, or Escape.

export type MenuItem = {
  label: string
  icon: IconName
  onClick: () => void
}

type Props = {
  label: string
  items: MenuItem[]
}

export function CardMenu({ label, items }: Props) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="plc-menu" ref={box}>
      <button
        type="button"
        className="plc-menu-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div className="plc-menu-list" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="plc-menu-item"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
            >
              <NavIcon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}