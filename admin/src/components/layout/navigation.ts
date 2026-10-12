import type { IconName } from '../icons/NavIcons'

// Admin sidebar sections, grouped. `ready: false` dims a section that has
// no page yet; set it to true when the page is added to App.tsx.

export type AdminTab =
  | 'overview'
  | 'participants'
  | 'studies'
  | 'data'
  | 'books'
  | 'questions'
  | 'activity'
  | 'content'
  | 'export'
  | 'settings'

export type NavItem = {
  id: AdminTab
  label: string
  icon: IconName
  ready: boolean
}

export type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    id: 'research',
    label: 'Research',
    items: [
      { id: 'overview', label: 'Overview', icon: 'home', ready: true },
      { id: 'participants', label: 'Participants', icon: 'users', ready: true },
      { id: 'studies', label: 'Studies', icon: 'study', ready: true },
    ],
  },
  {
    id: 'data',
    label: 'Data & Resources',
    items: [
      { id: 'data', label: 'All Data', icon: 'table', ready: true },
      { id: 'books', label: 'Books', icon: 'book', ready: true },
      { id: 'questions', label: 'Question Analytics', icon: 'chart', ready: true },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'activity', label: 'Activity', icon: 'activity', ready: true },
      { id: 'content', label: 'Content', icon: 'content', ready: false },
      { id: 'export', label: 'Export', icon: 'export', ready: false },
      { id: 'settings', label: 'Settings', icon: 'settings', ready: true },
    ],
  },
]

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items)

export function navLabel(tab: AdminTab): string {
  return navItems.find((i) => i.id === tab)?.label ?? ''
}