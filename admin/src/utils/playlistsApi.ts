import type {
  BrowseResult,
  LabelItem,
  MealKey,
  MealLabelsResponse,
  PlaylistDetail,
  PlaylistEntry,
  PlaylistItemRef,
  PlaylistKind,
  PlaylistOptions,
  PlaylistSummary,
} from '../types/playlists'
import { api } from './api'

// Playlist and meal label calls used by the editors and the Meal labels
// screen. The Playlists list and its changes live in hooks/usePlaylists.ts.

export function fetchPlaylistList(): Promise<PlaylistSummary[]> {
  return api<PlaylistSummary[]>('/admin/playlists')
}

export function fetchPlaylistOptions(): Promise<PlaylistOptions> {
  return api<PlaylistOptions>('/admin/playlists/options')
}

export function fetchPlaylist(id: number): Promise<PlaylistDetail> {
  return api<PlaylistDetail>(`/admin/playlists/${id}`)
}

export function browseContent(filter: { vegetable: string; meal: string; q: string }): Promise<BrowseResult> {
  const params = new URLSearchParams()
  if (filter.vegetable) params.set('vegetable', filter.vegetable)
  if (filter.meal) params.set('meal', filter.meal)
  if (filter.q) params.set('q', filter.q)
  return api<BrowseResult>(`/admin/playlists/content?${params.toString()}`)
}

export function previewItems(items: PlaylistItemRef[], lang: 'en' | 'es'): Promise<{ items: PlaylistEntry[] }> {
  return api<{ items: PlaylistEntry[] }>('/admin/playlists/preview', {
    method: 'POST',
    body: { items, lang },
  })
}

export function fetchMealLabels(): Promise<MealLabelsResponse> {
  return api<MealLabelsResponse>('/admin/meal-labels')
}

export function saveMealLabels(
  kind: PlaylistKind,
  id: number,
  meals: MealKey[],
): Promise<Pick<LabelItem, 'kind' | 'id' | 'meals'>> {
  return api<Pick<LabelItem, 'kind' | 'id' | 'meals'>>(`/admin/meal-labels/${kind}/${id}`, {
    method: 'PUT',
    body: { meals },
  })
}