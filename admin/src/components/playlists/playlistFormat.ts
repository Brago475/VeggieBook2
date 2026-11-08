import type { BrowseItem, PickedItem, PlaylistEntry, PlaylistKind, PlaylistTopic } from '../../types/playlists'

// Limits and wording shared by the Playlists page and editor.
// Limits match api/Admin/AdminPlaylistsController.cs.

export const MAX_NAME = 80
export const MAX_ITEMS = 60

export function itemKey(kind: PlaylistKind, id: number): string {
  return `${kind}:${id}`
}

export function plural(n: number, word: string): string {
  return n === 1 ? `1 ${word}` : `${n} ${word}s`
}

// "2 tips and 4 recipes"
export function countText(tips: number, recipes: number): string {
  return `${plural(tips, 'tip')} and ${plural(recipes, 'recipe')}`
}

// The question label with the vegetable filled in: "Making snacks with Zucchini".
export function topicLabel(topic: PlaylistTopic, vegetableName: string | null): string {
  return topic.textEn.replace('%s', vegetableName ?? 'vegetables')
}

export function pickedFromEntry(entry: PlaylistEntry): PickedItem {
  return {
    kind: entry.kind,
    id: entry.id,
    title: entry.title,
    vegetableName: entry.vegetableName,
    code: entry.kind === 'recipe' ? entry.code : null,
    photo: entry.kind === 'recipe' ? entry.photo : null,
  }
}

export function pickedFromBrowse(item: BrowseItem): PickedItem {
  return {
    kind: item.kind,
    id: item.id,
    title: item.title,
    vegetableName: item.vegetableName,
    code: item.code ?? null,
    photo: item.photo ?? null,
  }
}