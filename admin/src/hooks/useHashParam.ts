import { useCallback, useEffect, useState } from 'react'

// One tab or filter kept in the address after the page name, as in
// #notifications?tab=playlists, so a refresh reopens it. Changes replace the
// address instead of adding history steps. The first allowed value is the
// default and is left out of the address; anything not allowed falls back
// to it. Pass the allowed list as a constant defined outside the component.

function readParams(): URLSearchParams {
  const hash = window.location.hash
  const at = hash.indexOf('?')
  return new URLSearchParams(at === -1 ? '' : hash.slice(at + 1))
}

function writeParams(params: URLSearchParams) {
  const hash = window.location.hash
  const at = hash.indexOf('?')
  const page = at === -1 ? hash : hash.slice(0, at)
  const query = params.toString()
  const next = query ? `${page || '#'}?${query}` : page || window.location.pathname + window.location.search
  if (next !== hash) window.history.replaceState(window.history.state, '', next)
}

export function useHashParam<T extends string>(key: string, allowed: readonly T[]): [T, (next: T) => void] {
  const read = useCallback((): T => {
    const v = readParams().get(key)
    return allowed.includes(v as T) ? (v as T) : allowed[0]
  }, [key, allowed])

  const [value, setValue] = useState<T>(read)

  // Back and Forward between pages.
  useEffect(() => {
    const onPop = () => setValue(read())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [read])

  const set = useCallback(
    (next: T) => {
      const params = readParams()
      if (next === allowed[0]) params.delete(key)
      else params.set(key, next)
      writeParams(params)
      setValue(next)
    },
    [key, allowed],
  )

  return [value, set]
}