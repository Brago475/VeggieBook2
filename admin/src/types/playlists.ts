// Shapes of /api/admin/playlists (api/Admin/AdminPlaylistsController.cs).

export type PlaylistKind = 'tip' | 'recipe'

export type PlaylistSummary = {
  id: number
  nameEn: string
  nameEs: string | null
  archived: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string | null
  tips: number
  recipes: number
  kept: number
  notKept: number
  sent: number
  live: boolean
}

export type PlaylistItemRef = { kind: PlaylistKind; id: number }

export type TipBlock = { text: string; image: string | null }

export type RecipeEntry = {
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

export type TipEntry = {
  kind: 'tip'
  id: number
  vegetable: string
  vegetableName: string
  title: string
  blocks: TipBlock[]
}

// An item as the app shows it, in one language.
export type PlaylistEntry = RecipeEntry | TipEntry

export type PlaylistDetail = {
  id: number
  nameEn: string
  nameEs: string | null
  archived: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string | null
  items: PlaylistEntry[]
}

export type PlaylistTopic = {
  topic: string
  question: string
  textEn: string
  textEs: string
  label: string
}

export type TopicCount = { vegetable: string; topic: string; tips: number; recipes: number }

export type PlaylistOptions = {
  vegetables: { code: string; name: string }[]
  topics: PlaylistTopic[]
  counts: TopicCount[]
}

export type BrowseItem = {
  kind: PlaylistKind
  id: number
  vegetable: string
  vegetableName: string
  title: string
  topics: string[]
  code?: string | null
  photo?: string | null
  snippet?: string | null
  blocks?: number
}

export type BrowseResult = {
  tipCount: number
  recipeCount: number
  tips: BrowseItem[]
  recipes: BrowseItem[]
}

// One item in the editor's list, with what is needed to show it.
export type PickedItem = {
  kind: PlaylistKind
  id: number
  title: string
  vegetableName: string
  code: string | null
  photo: string | null
}

export type PlaylistDraft = {
  nameEn: string
  nameEs: string | null
  items: PlaylistItemRef[]
}