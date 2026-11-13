import type { TemplateDefaultLink } from '../types/notifications'
import { api } from './api'

// Template default playlists (api/Admin/AdminTemplatePlaylistsController.cs).

export function fetchTemplateDefaults(): Promise<TemplateDefaultLink[]> {
  return api<TemplateDefaultLink[]>('/admin/template-playlists')
}

export function setTemplateDefault(templateKey: string, vegetable: string, playlistId: number): Promise<unknown> {
  return api('/admin/template-playlists', {
    method: 'PUT',
    body: { templateKey, vegetable, playlistId },
  })
}

export function clearTemplateDefault(templateKey: string, vegetable: string): Promise<unknown> {
  const params = new URLSearchParams({ templateKey, vegetable })
  return api(`/admin/template-playlists?${params.toString()}`, { method: 'DELETE' })
}