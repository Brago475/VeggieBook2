import type { AdminNotification, PlaylistMode } from '../../types/notifications'
import type { MealKey, PickedItem } from '../../types/playlists'
import { MAX_ITEMS, MAX_NAME } from '../playlists/playlistFormat'

// State of the Playlist part of the notification editor. Saved and Pick
// both send a made playlist; Pick saves its items as a new playlist first.

export type PlaylistKindChoice = 'saved' | 'auto' | 'pick'

export type PlaylistChoice = {
  on: boolean
  kind: PlaylistKindChoice | null
  playlistId: number | null
  vegetable: string
  meal: MealKey | ''
  picked: PickedItem[]
  name: string
}

export const EMPTY_CHOICE: PlaylistChoice = {
  on: false,
  kind: null,
  playlistId: null,
  vegetable: '',
  meal: '',
  picked: [],
  name: '',
}

export const KIND_LABELS: Record<PlaylistKindChoice, string> = {
  saved: 'Saved',
  auto: 'Automatic',
  pick: 'Pick myself',
}

// The message's own playlist first; otherwise a saved playlist to start
// with (Send on a playlist card); otherwise none.
export function initialChoice(from: AdminNotification | null, startWith: number | null = null): PlaylistChoice {
  const p = from?.playlist
  if (!p) {
    return startWith !== null ? { ...EMPTY_CHOICE, on: true, kind: 'saved', playlistId: startWith } : EMPTY_CHOICE
  }
  if (p.auto && p.vegetable && p.meal) {
    return { ...EMPTY_CHOICE, on: true, kind: 'auto', vegetable: p.vegetable, meal: p.meal }
  }
  return { ...EMPTY_CHOICE, on: true, kind: 'saved', playlistId: p.id }
}

export function choiceProblem(c: PlaylistChoice): string | null {
  if (!c.on) return null
  if (c.kind === null) return 'Choose what kind of playlist to add, or turn the playlist off.'
  if (c.kind === 'saved') return c.playlistId === null ? 'Pick a saved playlist.' : null
  if (c.kind === 'auto') return !c.vegetable || !c.meal ? 'Pick a vegetable and a meal for the playlist.' : null

  const name = c.name.trim()
  if (c.picked.length === 0) return 'Choose at least one item for the playlist.'
  if (c.picked.length > MAX_ITEMS) return `A playlist holds up to ${MAX_ITEMS} items.`
  if (!name) return 'Name the playlist.'
  if (name.length > MAX_NAME) return `Keep the playlist name to ${MAX_NAME} characters or fewer.`
  return null
}

export function choiceMode(c: PlaylistChoice): PlaylistMode {
  if (!c.on || c.kind === null) return 'none'
  return c.kind === 'auto' ? 'auto' : 'made'
}