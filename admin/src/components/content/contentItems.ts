import type { ContentKind, ContentLibrary } from '../../types/content'

// Recipes and secrets in one list shape, so the grid, filters and window
// treat both the same way.

export type ContentItem = {
  key: string
  kind: ContentKind
  id: number
  // Vegetable code, or the category id as text. Empty when none.
  subject: string
  tag: string
  title: string
  sub: string | null
  image: string | null
  active: boolean
  kept: number
  takenOut: number
  order: number
}

export type ContentSort = 'code' | 'az' | 'kept' | 'out'

export type ContentFilterState = {
  kind: ContentKind
  subject: string
  search: string
  sort: ContentSort
}

export const noContentFilters: ContentFilterState = {
  kind: 'recipe',
  subject: '',
  search: '',
  sort: 'code',
}

export function libraryItems(lib: ContentLibrary, kind: ContentKind): ContentItem[] {
  if (kind === 'recipe') {
    const vegName = new Map(lib.vegetables.map((v) => [v.code, v.name]))
    return lib.recipes.map((r, i) => ({
      key: `recipe-${r.id}`,
      kind,
      id: r.id,
      subject: r.vegetable,
      tag: vegName.get(r.vegetable) ?? r.vegetable,
      title: r.title,
      sub: r.code,
      image: r.photo,
      active: r.active,
      kept: r.kept,
      takenOut: r.takenOut,
      order: i,
    }))
  }

  const catName = new Map(lib.categories.map((c) => [c.id, c.name]))
  return lib.secrets.map((s, i) => ({
    key: `secret-${s.id}`,
    kind,
    id: s.id,
    subject: s.category === null ? '' : String(s.category),
    tag: s.category === null ? 'No category' : catName.get(s.category) ?? `Category ${s.category}`,
    title: s.headline,
    sub: `#${s.number}`,
    image: s.image,
    active: s.active,
    kept: s.kept,
    takenOut: s.takenOut,
    order: i,
  }))
}

export function applyContentFilters(items: ContentItem[], f: ContentFilterState): ContentItem[] {
  const needle = f.search.trim().toLowerCase()
  const list = items.filter(
    (i) =>
      (!f.subject || i.subject === f.subject) &&
      (!needle || i.title.toLowerCase().includes(needle) || (i.sub ?? '').toLowerCase().includes(needle)),
  )

  const sorted = [...list]
  if (f.sort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title))
  else if (f.sort === 'kept') sorted.sort((a, b) => b.kept - a.kept || a.order - b.order)
  else if (f.sort === 'out') sorted.sort((a, b) => b.takenOut - a.takenOut || a.order - b.order)
  else sorted.sort((a, b) => a.order - b.order)
  return sorted
}