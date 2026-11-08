import { useCallback, useEffect, useState } from 'react'
import type { PlaylistDraft, PlaylistOptions, PlaylistSummary } from '../types/playlists'
import { api } from '../utils/api'

// Loads the Playlists page and runs create, edit, archive, and restore.
// The list reloads after each change and every minute while the tab is
// visible. A failed change returns the API's message for the page to show.

const REFRESH_MS = 60_000

export function usePlaylists() {
  const [list, setList] = useState<PlaylistSummary[] | null>(null)
  const [options, setOptions] = useState<PlaylistOptions | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [items, opts] = await Promise.all([
        api<PlaylistSummary[]>('/admin/playlists'),
        api<PlaylistOptions>('/admin/playlists/options'),
      ])
      setList(items)
      setOptions(opts)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [load])

  const change = useCallback(
    async (run: () => Promise<unknown>): Promise<string | null> => {
      try {
        await run()
        await load()
        return null
      } catch (err) {
        await load()
        return (err as Error).message
      }
    },
    [load],
  )

  const create = useCallback(
    (draft: PlaylistDraft) => change(() => api('/admin/playlists', { method: 'POST', body: draft })),
    [change],
  )

  const save = useCallback(
    (id: number, draft: PlaylistDraft) =>
      change(() => api(`/admin/playlists/${id}`, { method: 'PUT', body: draft })),
    [change],
  )

  const archive = useCallback(
    (id: number) => change(() => api(`/admin/playlists/${id}/archive`, { method: 'POST' })),
    [change],
  )

  const restore = useCallback(
    (id: number) => change(() => api(`/admin/playlists/${id}/restore`, { method: 'POST' })),
    [change],
  )

  return { list, options, error, reload: load, create, save, archive, restore }
}