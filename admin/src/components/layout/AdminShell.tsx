import { useEffect, useRef, useState, type FocusEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { NavIcon } from '../icons/NavIcons'
import { navGroups, navLabel, type AdminTab } from './navigation'
import { TopbarSlotContext } from './TopbarSlot'
import '../../styles/shell.css'
import '../../styles/topbar.css'

// The frame around every admin screen: the sidebar with every section, the
// signed-in account, and the top bar with a breadcrumb and the page title.
//
// Open sidebar: the logo with a round back-arrow button, the sections in
// three titled groups, and the account box at the bottom.
// Closed sidebar (wide screens): a white card floating next to the page with
// icons only. The chosen page is a solid green square, dots split the
// groups, and hovering any icon shows a small card with its name and group.
// The open button and the account sit at the bottom.
// The choice is kept in this browser (localStorage); if storage isn't
// available, the sidebar simply starts open.
// Narrow screens (900px or less): the sidebar hides, the menu button slides
// the open sidebar in, and the back-arrow button slides it closed.
//
// The account box shows ADMIN: red for the main (root) admin, green for every
// other admin. When closed, the avatar's ring shows the same color. It opens
// a small menu with Sign out, which closes when you click anywhere else or
// press Escape.
//
// The top bar has two spots for the page's own controls (see
// TopbarSlot.tsx): one right of the title, and a full-width row under it.
// All Data puts its downloads on the right and its filters underneath.

export type { AdminTab }

const STORAGE_KEY = 'vb2-admin-sidebar'
const WIDE = '(min-width: 901px)'

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

type Tip = {
  title: string
  caption: string
  soon: boolean
  top: number
  left: number
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
  const [tip, setTip] = useState<Tip | null>(null)
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null)
  const [belowSlot, setBelowSlot] = useState<HTMLDivElement | null>(null)
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

  // The hover card is placed on the screen, so it goes away whenever the
  // page moves or the window changes size.
  useEffect(() => {
    if (!tip) return
    const hide = () => setTip(null)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [tip])

  function choose(next: AdminTab) {
    onTab(next)
    setMenuOpen(false)
    setTip(null)
  }

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    setTip(null)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'collapsed' : 'open')
    } catch {
      // Storage not available; the choice lasts until the page reloads.
    }
  }

  // Hover cards only show on the closed sidebar on wide screens; the open
  // sidebar already shows every name.
  function showTip(
    e: ReactMouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
    title: string,
    caption: string,
    soon = false,
  ) {
    if (!collapsed || !window.matchMedia(WIDE).matches) return
    const box = e.currentTarget.getBoundingClientRect()
    setTip({ title, caption, soon, top: box.top + box.height / 2, left: box.right + 14 })
  }

  function hideTip() {
    setTip(null)
  }

  const label = navLabel(tab)
  const toggleLabel = collapsed ? 'Open sidebar' : 'Collapse sidebar'
  const roleName = isRoot ? 'Main admin' : 'Admin'

  const toggle = (
    <button
      type="button"
      className="sidebar-toggle"
      aria-label={toggleLabel}
      onClick={toggleCollapsed}
      onMouseEnter={(e) => showTip(e, toggleLabel, 'Sidebar')}
      onMouseLeave={hideTip}
      onFocus={(e) => showTip(e, toggleLabel, 'Sidebar')}
      onBlur={hideTip}
    >
      <NavIcon name={collapsed ? 'expand' : 'back'} size={18} />
    </button>
  )

  return (
    <div className={collapsed ? 'shell is-collapsed' : 'shell'}>
      <aside className={menuOpen ? 'sidebar is-open' : 'sidebar'}>
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/brand/logo-positive-en.png" alt="VeggieBook" />
          <img className="sidebar-mark" src="/LogoVB2.png" alt="VeggieBook" />
          {!collapsed && toggle}
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <NavIcon name="back" size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin sections">
          {navGroups.map((group) => (
            <div key={group.id} className="nav-group" role="group" aria-label={group.label}>
              <span className="nav-group-label" aria-hidden="true">
                {group.label}
              </span>
              <span className="nav-group-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {group.items.map((item) => {
                const classes = ['nav-item']
                if (item.id === tab) classes.push('is-active')
                else if (!item.ready) classes.push('is-soon')
                const soon = !item.ready && item.id !== tab
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={classes.join(' ')}
                    aria-label={item.label}
                    aria-current={item.id === tab ? 'page' : undefined}
                    onClick={() => choose(item.id)}
                    onMouseEnter={(e) => showTip(e, item.label, group.label, soon)}
                    onMouseLeave={hideTip}
                    onFocus={(e) => showTip(e, item.label, group.label, soon)}
                    onBlur={hideTip}
                  >
                    <span className="nav-icon">
                      <NavIcon name={item.icon} />
                    </span>
                    <span className="nav-text">{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          {collapsed && toggle}

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
              aria-label={`${email}, ${roleName}`}
              aria-haspopup="menu"
              aria-expanded={userMenu}
              onClick={() => {
                setTip(null)
                setUserMenu((open) => !open)
              }}
              onMouseEnter={(e) => !userMenu && showTip(e, email, roleName)}
              onMouseLeave={hideTip}
            >
              <span className={isRoot ? 'avatar is-root' : 'avatar'} aria-hidden="true">
                {email.charAt(0).toUpperCase()}
              </span>
              <span className="sidebar-user-text">
                <span className="sidebar-email">{email}</span>
                <span className={isRoot ? 'sidebar-role is-root' : 'sidebar-role'}>ADMIN</span>
              </span>
              <span className="user-chip-arrow">
                <NavIcon name="chevron" size={18} />
              </span>
            </button>
          </div>
        </div>
      </aside>

      {tip && (
        <div className="nav-tip" role="tooltip" style={{ top: tip.top, left: tip.left }}>
          <span className="nav-tip-caption">{tip.caption}</span>
          <span className="nav-tip-title">
            {tip.title}
            {tip.soon && <span className="nav-tip-soon">Soon</span>}
          </span>
        </div>
      )}

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
          <div className="topbar-actions" ref={setActionsSlot} />
          <div className="topbar-below" ref={setBelowSlot} />
        </header>

        <TopbarSlotContext.Provider value={{ actions: actionsSlot, below: belowSlot }}>
          <main className="shell-main">{children}</main>
        </TopbarSlotContext.Provider>
      </div>
    </div>
  )
}