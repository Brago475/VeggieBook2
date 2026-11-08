import type { Lang } from '../i18n/language'
import { apiFetch } from './api'

// Playlists inside Notifications (api/Playlists/PlaylistsController.cs and
// OwnPlaylistsController.cs). Every call records its step for research on
// the server; screens never wait on tracking.

export type PlaylistChoice = 'kept' | 'skipped' | null

export type PlaylistRecipe = {
  kind: 'recipe'
  id: number
  vegetable: string
  vegetableName: string
  code: string | null
  title: string
  timeToPrepare: string
  timeToCook: string
  servings: string
  photo: string | null
}

export type PlaylistTip = {
  kind: 'tip'
  id: number
  vegetable: string
  vegetableName: string
  title: string
  blocks: { text: string; image: string | null }[]
}

export type PlaylistEntry = PlaylistRecipe | PlaylistTip

export type PlaylistDetail = {
  id: number
  name: string
  // Playlists from the team only.
  choice?: PlaylistChoice
  // Own playlists only.
  recipeIds?: number[]
  items: PlaylistEntry[]
}

export type KeptPlaylist = {
  id: number
  name: string
  tips: number
  recipes: number
  cover: string | null
  keptAt: string
}

export type OwnPlaylistSummary = {
  id: number
  name: string
  recipes: number
  cover: string | null
  updatedAt: string
}

export type PlaylistLibrary = {
  kept: KeptPlaylist[]
  own: OwnPlaylistSummary[]
}

export type BookChoice = {
  id: string
  vegetable: string | null
  vegetableName: string
  createdAt: string
  recipes: { id: number; code: string | null; title: string; photo: string | null }[]
}

export function fetchPlaylistLibrary(lang: Lang) {
  return apiFetch<PlaylistLibrary>(`/playlists?lang=${lang}`)
}

export function fetchPlaylist(id: number, lang: Lang) {
  return apiFetch<PlaylistDetail>(`/playlists/${id}?lang=${lang}`)
}

export function keepPlaylist(id: number, notificationId: number | null) {
  return apiFetch<void>(`/playlists/${id}/keep`, { method: 'POST', body: { notificationId } })
}

export function skipPlaylist(id: number, notificationId: number | null) {
  return apiFetch<void>(`/playlists/${id}/skip`, { method: 'POST', body: { notificationId } })
}

export function removePlaylist(id: number) {
  return apiFetch<void>(`/playlists/${id}/keep`, { method: 'DELETE' })
}

export function playlistItemOpened(id: number, kind: 'recipe' | 'tip', itemId: number) {
  return apiFetch<void>(`/playlists/${id}/opened/${kind}/${itemId}`, { method: 'POST' })
}

export function fetchOwnPlaylist(id: number, lang: Lang) {
  return apiFetch<PlaylistDetail>(`/playlists/own/${id}?lang=${lang}`)
}

export function fetchBookChoices(lang: Lang) {
  return apiFetch<BookChoice[]>(`/playlists/own/choices?lang=${lang}`)
}

export function createOwnPlaylist(name: string, recipeIds: number[]) {
  return apiFetch<{ id: number }>('/playlists/own', { method: 'POST', body: { name, recipeIds } })
}

export function updateOwnPlaylist(id: number, name: string, recipeIds: number[]) {
  return apiFetch<void>(`/playlists/own/${id}`, { method: 'PUT', body: { name, recipeIds } })
}

export function deleteOwnPlaylist(id: number) {
  return apiFetch<void>(`/playlists/own/${id}`, { method: 'DELETE' })
}

export function ownRecipeOpened(id: number, recipeId: number) {
  return apiFetch<void>(`/playlists/own/${id}/opened/${recipeId}`, { method: 'POST' })
}