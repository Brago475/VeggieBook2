import { useEffect, useRef, useState } from 'react'
import { MenuIcon } from './LibraryIcons'

// The ☰ Menu button on the home screen, and the list it opens.
//
// Two groups, with a line between them:
//   items         features and information, such as About VeggieBook.
//                 New features are added here.
//   accountItems  the account: Account settings and Sign out, or for a
//                 guest, Create account, Sign in, and End guest visit.
//                 Kept at the bottom, the way most apps do it, so signing
//                 out is always in the same easy place.
//
// An item marked danger (Sign out, End guest visit) shows in red.
//
// Labeled "Menu", not three lines alone: the original VeggieBook's research
// found pantry clients did best with plainly labeled controls.
//
// The list uses the ⋮ menu's styles (menu.css), so both menus look and
// behave the same. Like the ⋮ menu, it closes when an item is picked, on a
// click anywhere outside, and on Escape, which also puts focus back on the
// button so keyboard users keep their place.

export type MainMenuItem = {
  label: string
  icon: React.ReactNode
  onSelect: () => void
  danger?: boolean
}

type Props = {
  items: MainMenuItem[]
  accountItems: MainMenuItem[]
}

export function MainMenu({ items, accountItems }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return

    // First item gets focus, so Enter picks it right away.
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

  function row(item: MainMenuItem) {
    return (
      <li key={item.label} role="none">
        <button
          type="button"
          role="menuitem"
          className={item.danger ? 'menu-item is-danger' : 'menu-item'}
          onClick={() => {
            setOpen(false)
            item.onSelect()
          }}
        >
          {item.icon}
          {item.label}
        </button>
      </li>
    )
  }

  return (
    <div className="menu main-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="main-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MenuIcon />
        Menu
      </button>

      {open && (
        <ul className="menu-list" role="menu" ref={listRef}>
          {items.map(row)}
          {items.length > 0 && accountItems.length > 0 && (
            <li role="separator" className="main-menu-divider" />
          )}
          {accountItems.map(row)}
        </ul>
      )}
    </div>
  )
}