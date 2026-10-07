import type { IconName } from '../icons/NavIcons'

// Every section of the admin site, in sidebar order.
//
// `ready` marks the sections that are built. The rest show a "Soon" tag in
// the sidebar and a short description of what is coming. When a section is
// built, set ready to true and add its page in App.tsx.

export type AdminTab =
  | 'overview'
  | 'analytics'
  | 'accounts'
  | 'studies'
  | 'questions'
  | 'answers'
  | 'spss'
  | 'reports'
  | 'system'

export type NavItem = {
  id: AdminTab
  label: string
  icon: IconName
  ready: boolean
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { id: 'overview', label: 'Overview', icon: 'home', ready: true },
      { id: 'analytics', label: 'Analytics', icon: 'chart', ready: true },
    ],
  },
  {
    label: 'People',
    items: [{ id: 'accounts', label: 'Accounts', icon: 'users', ready: true }],
  },
  {
    label: 'Research',
    items: [
      { id: 'studies', label: 'Studies', icon: 'book', ready: false },
      { id: 'questions', label: 'Questions', icon: 'question', ready: false },
      { id: 'answers', label: 'Answers', icon: 'answers', ready: false },
      { id: 'spss', label: 'SPSS Data', icon: 'table', ready: false },
      { id: 'reports', label: 'Reports', icon: 'report', ready: false },
    ],
  },
  {
    label: 'Admin',
    items: [{ id: 'system', label: 'System', icon: 'server', ready: false }],
  },
]

export function navLabel(tab: AdminTab): string {
  for (const group of navGroups) {
    const item = group.items.find((i) => i.id === tab)
    if (item) return item.label
  }
  return ''
}