import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavIcon } from '../icons/NavIcons'
import { navItems, navLabel, type AdminTab } from './navigation'
import '../../styles/shell.css'

// The frame around every admin screen: the sidebar with every section, the
// signed-in account, and the top bar with a breadcrumb and the page title.
//
// Wide screens: the button next to the logo collapses the sidebar to icons
// and opens it again. The choice is kept in this browser (localStorage); if
// storage isn't available, the sidebar simply starts open.
// Narrow screens: the sidebar hides, the menu button opens it, and the same
// arrow button slides it closed.
//
// The account box at the bottom shows ADMIN: red for the main (root) admin,
// green for every other admin. It opens a small menu with Sign out, which
// closes when you click anywhere else or press Escape.

export type { AdminTab }

const STORAGE_KEY = 'vb2-admin-sidebar'

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

type Props = {
  email: string
  isRoot: boolean
  tab: AdminTab
  onTab: (tab: AdminTab) => void
  onSignOut: () => Promise<void>
  children: ReactNode
}

export function AdminShell({ email, isRoot, tab, onTab, onSignOut, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [userMenu, setUserMenu] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userMenu) return

    function onPointer(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenu(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setUserMenu(false)
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenu])

  function choose(next: AdminTab) {
    onTab(next)
    setMenuOpen(false)
  }

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'collapsed' : 'open')
    } catch {
      // Storage not available; the choice lasts until the page reloads.
    }
  }

  const label = navLabel(tab)

  return (
    <div className={collapsed ? 'shell is-collapsed' : 'shell'}>
      <aside className={menuOpen ? 'sidebar is-open' : 'sidebar'}>
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/brand/logo-positive-en.png" alt="VeggieBook" />
          <img className="sidebar-mark" src="/LogoVB2.png" alt="VeggieBook" />
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
            onClick={toggleCollapsed}
          >
            <NavIcon name={collapsed ? 'expand' : 'collapse'} size={18} />
          </button>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <NavIcon name="collapse" size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin sections">
          {navItems.map((item) => {
            const classes = ['nav-item']
            if (item.id === tab) classes.push('is-active')
            else if (!item.ready) classes.push('is-soon')
            return (
              <button
                key={item.id}
                type="button"
                className={classes.join(' ')}
                aria-current={item.id === tab ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                onClick={() => choose(item.id)}
              >
                <NavIcon name={item.icon} />
                <span className="nav-text">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-user" ref={userRef}>
          {userMenu && (
            <div className="user-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="user-menu-item"
                onClick={() => {
                  setUserMenu(false)
                  void onSignOut()
                }}
              >
                <NavIcon name="signout" size={16} />
                Sign out
              </button>
            </div>
          )}
          <button
            type="button"
            className="user-chip"
            aria-haspopup="menu"
            aria-expanded={userMenu}
            title={collapsed ? email : undefined}
            onClick={() => setUserMenu((open) => !open)}
          >
            <span className="avatar" aria-hidden="true">
              {email.charAt(0).toUpperCase()}
            </span>
            <span className="sidebar-user-text">
              <span className="sidebar-email">{email}</span>
              <span
                className={isRoot ? 'sidebar-role is-root' : 'sidebar-role'}
                title={isRoot ? 'Main admin' : 'Admin'}
              >
                ADMIN
              </span>
            </span>
            <span className="user-chip-arrow">
              <NavIcon name="updown" size={16} />
            </span>
          </button>
        </div>
      </aside>

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="shell-body">
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <NavIcon name="menu" />
          </button>
          <div className="topbar-text">
            <span className="breadcrumb">
              Home / <span className="breadcrumb-current">{label}</span>
            </span>
            <h1 className="topbar-title">{label}</h1>
          </div>
        </header>

        <main className="shell-main">{children}</main>
      </div>
    </div>
  )
}