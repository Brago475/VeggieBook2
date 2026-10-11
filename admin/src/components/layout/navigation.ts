import type { IconName } from '../icons/NavIcons'

// Every section of the admin site, in sidebar order, split into three groups:
//
//   Research            Overview, Participants, Studies
//   Data & Resources    All Data, Books, Question Analytics
//   System              Activity, Content, Export, Settings
//
// The open sidebar shows each group's title with a line between groups; the
// closed sidebar shows three small dots between groups instead.
//
// `ready` marks the sections that are built. The rest are dimmed in the
// sidebar. When a section is built, set ready to true and add its page in
// App.tsx.

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
      { id: 'participants', label: 'Participants', icon: 'users', ready: false },
      { id: 'studies', label: 'Studies', icon: 'study', ready: true },
    ],
  },
  {
    id: 'data',
    label: 'Data & Resources',
    items: [
      { id: 'data', label: 'All Data', icon: 'table', ready: true },
      { id: 'books', label: 'Books', icon: 'book', ready: false },
      { id: 'questions', label: 'Question Analytics', icon: 'chart', ready: true },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'activity', label: 'Activity', icon: 'activity', ready: false },
      { id: 'content', label: 'Content', icon: 'content', ready: false },
      { id: 'export', label: 'Export', icon: 'export', ready: false },
      { id: 'settings', label: 'Settings', icon: 'settings', ready: true },
    ],
  },
]

// The same sections as one flat list, for anything that doesn't need groups.
export const navItems: NavItem[] = navGroups.flatMap((g) => g.items)

export function navLabel(tab: AdminTab): string {
  return navItems.find((i) => i.id === tab)?.label ?? ''
}