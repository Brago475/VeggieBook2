import type { DraftKind, SavedDraft } from '../types/drafts'
import { api } from './api'

// Calls for saved drafts. A new draft is created on its first save; later
// saves update it.

export function listDrafts<T>(kind: DraftKind): Promise<SavedDraft<T>[]> {
  return api<SavedDraft<T>[]>(`/admin/drafts?kind=${kind}`)
}

export function saveDraft(
  kind: DraftKind,
  id: number | null,
  title: string | null,
  payload: unknown,
): Promise<{ id: number }> {
  return id === null
    ? api<{ id: number }>('/admin/drafts', { method: 'POST', body: { kind, title, payload } })
    : api<{ id: number }>(`/admin/drafts/${id}`, { method: 'PUT', body: { title, payload } })
}

export function deleteDraft(id: number): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/admin/drafts/${id}`, { method: 'DELETE' })
}