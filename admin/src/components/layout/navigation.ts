import type { IconName } from '../icons/NavIcons'

// Every section of the admin site, in sidebar order. One flat list.
//
// `ready` marks the sections that are built. The rest are dimmed in the
// sidebar and show a short description of what is coming. When a section is
// built, set ready to true and add its page in App.tsx.
//
// While the new pages are being built, some sections show an older screen:
// All Data shows the Research page, Question Analytics shows the Analytics
// page, and Settings shows the Accounts page (see App.tsx).

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

export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'home', ready: true },
  { id: 'participants', label: 'Participants', icon: 'users', ready: false },
  { id: 'studies', label: 'Studies', icon: 'study', ready: false },
  { id: 'data', label: 'All Data', icon: 'table', ready: true },
  { id: 'books', label: 'Books', icon: 'book', ready: false },
  { id: 'questions', label: 'Question Analytics', icon: 'chart', ready: true },
  { id: 'activity', label: 'Activity', icon: 'activity', ready: false },
  { id: 'content', label: 'Content', icon: 'content', ready: false },
  { id: 'export', label: 'Export', icon: 'export', ready: false },
  { id: 'settings', label: 'Settings', icon: 'settings', ready: true },
]

export function navLabel(tab: AdminTab): string {
  return navItems.find((i) => i.id === tab)?.label ?? ''
}