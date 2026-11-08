import { useCallback, useEffect, useState } from 'react'
import { useLang } from '../i18n/languageContext'
import type { PlaylistSource } from '../utils/routes'
import {
  fetchOwnPlaylist,
  fetchPlaylist,
  fetchPlaylistLibrary,
  type PlaylistChoice,
  type PlaylistDetail,
  type PlaylistLibrary,
} from '../utils/playlistsApi'

// Loads the Playlists tab and one playlist, in the site language. Each
// result is kept with the key it was asked for and only returned while that
// key still matches, so an old playlist never shows under a new address.

type Loaded<T> = { key: string; data: T | null; error: string | null }

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'error'
}

export function usePlaylistLibrary() {
  const { lang } = useLang()
  const [loaded, setLoaded] = useState<Loaded<PlaylistLibrary> | null>(null)

  useEffect(() => {
    let live = true
    fetchPlaylistLibrary(lang)
      .then((data) => live && setLoaded({ key: lang, data, error: null }))
      .catch((err) => live && setLoaded({ key: lang, data: null, error: messageOf(err) }))
    return () => {
      live = false
    }
  }, [lang])

  const current = loaded?.key === lang ? loaded : null
  return { data: current?.data ?? null, error: current?.error ?? null, loading: current === null }
}

export function usePlaylistDetail(source: PlaylistSource, id: number) {
  const { lang } = useLang()
  const key = `${source}:${id}:${lang}`
  const [loaded, setLoaded] = useState<Loaded<PlaylistDetail> | null>(null)

  useEffect(() => {
    let live = true
    const run = source === 'admin' ? fetchPlaylist(id, lang) : fetchOwnPlaylist(id, lang)
    run
      .then((data) => live && setLoaded({ key, data, error: null }))
      .catch((err) => live && setLoaded({ key, data: null, error: messageOf(err) }))
    return () => {
      live = false
    }
  }, [key, source, id, lang])

  const setChoice = useCallback((choice: PlaylistChoice) => {
    setLoaded((prev) => (prev?.data ? { ...prev, data: { ...prev.data, choice } } : prev))
  }, [])

  const current = loaded?.key === key ? loaded : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    setChoice,
  }
}