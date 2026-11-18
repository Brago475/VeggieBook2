import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { NavIcon, type IconName } from '../icons/NavIcons'

// The ⋮ button on a card and its small menu. The menu is drawn on the page
// body, so a panel that clips its content cannot hide it. It opens below the
// button, or above when there is no room. Closes on a pick, a click outside,
// Escape, scroll, or resize. A danger item shows in orange.

export type MenuItem = {
  label: string
  icon: IconName | 'download' | 'delete'
  onClick: () => void
  danger?: boolean
}

type Props = {
  label: string
  items: MenuItem[]
}

const ROW_HEIGHT = 36
const GAP = 4

function LineIcon({ d }: { d: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

const DOWNLOAD = 'M12 3v12M7 10l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'
const TRASH = 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'

function ItemIcon({ icon }: { icon: MenuItem['icon'] }) {
  if (icon === 'download') return <LineIcon d={DOWNLOAD} />
  if (icon === 'delete') return <LineIcon d={TRASH} />
  return <NavIcon name={icon} size={16} />
}

export function CardMenu({ label, items }: Props) {
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState<CSSProperties>({})
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    const rect = button.current?.getBoundingClientRect()
    if (!rect) return
    const height = items.length * ROW_HEIGHT + 10
    const right = window.innerWidth - rect.right
    const up = rect.bottom + GAP + height > window.innerHeight && rect.top > height
    setPlace(
      up
        ? { bottom: window.innerHeight - rect.top + GAP, right }
        : { top: rect.bottom + GAP, right },
    )
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    list.current?.querySelector<HTMLButtonElement>('button')?.focus()

    function onDown(e: MouseEvent) {
      const target = e.target as Node
      if (!button.current?.contains(target) && !list.current?.contains(target)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    function close() {
      setOpen(false)
    }

    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <div className="plc-menu">
      <button
        ref={button}
        type="button"
        className="plc-menu-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div ref={list} className="plc-menu-list" role="menu" aria-label={label} style={place}>
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={item.danger ? 'plc-menu-item is-danger' : 'plc-menu-item'}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
              >
                <ItemIcon icon={item.icon} />
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}