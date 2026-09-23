import { useCallback, useEffect, useState } from 'react'
import { parseRoute } from '../utils/routes'

// The current address, kept in sync with the browser.
//
// navigate(path)            adds an address, like following a link
// navigate(path, replace)   swaps the current address, so Back skips it
// goUp(path)                goes to a parent screen: if that is the page
//                           the user came from, this is the browser's own
//                           Back; otherwise the address is swapped. Either
//                           way the history does not fill with loops.
//
// Every added address remembers the one it came from (history.state.prev),
// which is how goUp knows whether stepping back is the same as going up.
//
// Scroll: the browser's automatic scroll restoring is turned off, because
// it jumps before React has drawn the page. New screens start at the top;
// the book view puts its list back where it was on its own.

type HistoryState = { prev?: string } | null

export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    function onPop() {
      setPath(window.location.pathname)
      window.scrollTo(0, 0)
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const from = window.location.pathname
    if (to === from) return

    if (options?.replace) {
      // Keeps the entry's memory of where it came from.
      window.history.replaceState(window.history.state, '', to)
    } else {
      window.history.pushState({ prev: from }, '', to)
      window.scrollTo(0, 0)
    }
    setPath(to)
  }, [])

  const goUp = useCallback(
    (to: string) => {
      const state = window.history.state as HistoryState
      if (state?.prev === to) window.history.back()
      else navigate(to, { replace: true })
    },
    [navigate],
  )

  return { route: parseRoute(path), path, navigate, goUp }
}