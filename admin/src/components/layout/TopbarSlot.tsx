import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// A place in the top bar where a page can put its own controls, such as
// All Data's search, filters, and download buttons. AdminShell owns the
// spot; a page fills it with <TopbarActions>. When the page closes, its
// controls leave the top bar with it.

export const TopbarSlotContext = createContext<HTMLElement | null>(null)

export function TopbarActions({ children }: { children: ReactNode }) {
  const slot = useContext(TopbarSlotContext)
  return slot ? createPortal(children, slot) : null
}