import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Two places in the top bar where a page can put its own controls:
//
//   <TopbarActions>  on the right of the page title (All Data: downloads
//                    and Refresh)
//   <TopbarBelow>    a full-width row under the title (All Data: search
//                    and filters)
//
// AdminShell owns both spots. When the page closes, its controls leave the
// top bar with it, and empty spots take no space.

export type TopbarSlots = {
  actions: HTMLElement | null
  below: HTMLElement | null
}

export const TopbarSlotContext = createContext<TopbarSlots>({ actions: null, below: null })

export function TopbarActions({ children }: { children: ReactNode }) {
  const { actions } = useContext(TopbarSlotContext)
  return actions ? createPortal(children, actions) : null
}

export function TopbarBelow({ children }: { children: ReactNode }) {
  const { below } = useContext(TopbarSlotContext)
  return below ? createPortal(children, below) : null
}