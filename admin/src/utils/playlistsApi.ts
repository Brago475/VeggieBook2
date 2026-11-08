import type {
  BrowseResult,
  PlaylistDetail,
  PlaylistEntry,
  PlaylistItemRef,
} from '../types/playlists'
import { api } from './api'

// Playlist calls used inside the editor. The list and its changes live in
// hooks/usePlaylists.ts.

export function fetchPlaylist(id: number): Promise<PlaylistDetail> {
  return api<PlaylistDetail>(`/admin/playlists/${id}`)
}

export function browseContent(filter: { vegetable: string; topic: string; q: string }): Promise<BrowseResult> {
  const params = new URLSearchParams()
  if (filter.vegetable) params.set('vegetable', filter.vegetable)
  if (filter.topic) params.set('topic', filter.topic)
  if (filter.q) params.set('q', filter.q)
  return api<BrowseResult>(`/admin/playlists/content?${params.toString()}`)
}

export function previewItems(items: PlaylistItemRef[], lang: 'en' | 'es'): Promise<{ items: PlaylistEntry[] }> {
  return api<{ items: PlaylistEntry[] }>('/admin/playlists/preview', {
    method: 'POST',
    body: { items, lang },
  })
}