import { useEffect, useRef, useState } from 'react'
import { COMMON } from '../../i18n/strings/common'
import { HOME } from '../../i18n/strings/home'
import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import { MenuIcon } from '../icons/LibraryIcons'
import { LanguageSwitch } from './LanguageSwitch'

// The ☰ Menu button on the home screen, and the list it opens, styled like
// the admin sidebar: small spaced-out section labels over plain rows.
//
// Three sections:
//   VEGGIEBOOK  items: features and information, such as Notifications and
//               About VeggieBook. New features are added here.
//   LANGUAGE    the English and Spanish switch.
//   ACCOUNT     accountItems: Profile and settings and Sign out, or for a
//               guest, Create account, Sign in, and End guest visit. The red
//               items come last, so signing out is always in the same place.
//
// A row with a badge shows its count, and the Menu button shows a dot while
// any row has one.
//
// Labeled "Menu", not three lines alone: the original VeggieBook's research
// found pantry clients did best with plainly labeled controls.
//
// Closes when an item is picked, on a click anywhere outside, and on
// Escape, which also puts focus back on the button so keyboard users keep
// their place. Changing the language keeps it open.

export type MainMenuItem = {
  label: string
  icon: React.ReactNode
  onSelect: () => void
  danger?: boolean
  // A count shown on the row, such as unread messages. Hidden at 0.
  badge?: number
}

type Props = {
  items: MainMenuItem[]
  accountItems: MainMenuItem[]
}

const BADGE_MAX = 9

export function MainMenu({ items, accountItems }: Props) {
  const t = useStrings(COMMON)
  const home = useStrings(HOME)
  const notes = useStrings(NOTIFICATIONS)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const totalBadge = [...items, ...accountItems].reduce(
    (sum, item) => sum + (item.badge ?? 0),
    0,
  )

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
    const count = item.badge ?? 0
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
          {count > 0 && (
            <>
              <span className="main-menu-badge" aria-hidden="true">
                {count > BADGE_MAX ? `${BADGE_MAX}+` : count}
              </span>
              <span className="visually-hidden">, {notes.unreadCount(count)}</span>
            </>
          )}
        </button>
      </li>
    )
  }

  function heading(label: string) {
    return (
      <li role="presentation" className="main-menu-heading">
        {label}
      </li>
    )
  }

  const divider = <li role="separator" className="main-menu-divider" />

  const accountPlain = accountItems.filter((item) => !item.danger)
  const accountDanger = accountItems.filter((item) => item.danger)

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
        {t.menu}
        {totalBadge > 0 && (
          <>
            <span className="main-menu-dot" aria-hidden="true" />
            <span className="visually-hidden">, {notes.unreadCount(totalBadge)}</span>
          </>
        )}
      </button>

      {open && (
        <ul className="menu-list" role="menu" ref={listRef}>
          {items.length > 0 && (
            <>
              {heading(home.menuVeggieBook)}
              {items.map(row)}
              {divider}
            </>
          )}

          {heading(t.language)}
          <li role="none">
            <LanguageSwitch />
          </li>
          {divider}

          {heading(home.menuAccount)}
          {accountPlain.map(row)}
          {accountDanger.map(row)}
        </ul>
      )}
    </div>
  )
}