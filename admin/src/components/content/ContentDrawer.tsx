import { useEffect, type ReactNode } from 'react'
import { NavIcon } from '../icons/NavIcons'
import '../../styles/content.css'

// A panel that slides in from the right to show one recipe or secret
// without leaving the page. Closes with the X, Escape, or a click outside.
// The page behind it doesn't scroll while it is open.

type Props = {
  label: string
  onClose: () => void
  children: ReactNode
}

export function ContentDrawer({ label, onClose, children }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={label}>
        <header className="drawer-head">
          <span className="drawer-label">{label}</span>
          <button type="button" className="drawer-close" aria-label="Close" onClick={onClose}>
            <NavIcon name="close" />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </>
  )
}