import { useCallback, useState } from 'react'

// The last few downloads started from the Export page, kept in this browser
// only. Storage can be blocked, so every read and write is guarded.

export type RecentDownload = { label: string; at: string }

const KEY = 'vb2-admin-recent-downloads'
const MAX = 6

function read(): RecentDownload[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as RecentDownload[]) : []
    return Array.isArray(list) ? list.slice(0, MAX) : []
  } catch {
    return []
  }
}

export function useRecentDownloads() {
  const [items, setItems] = useState<RecentDownload[]>(read)

  const remember = useCallback((label: string) => {
    setItems((prev) => {
      const next = [{ label, at: new Date().toISOString() }, ...prev].slice(0, MAX)
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // Storage not available; the list lasts until the page reloads.
      }
      return next
    })
  }, [])

  return { items, remember }
}