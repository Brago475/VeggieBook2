// Small line icons for the playlist page and its bottom bar.

type IconProps = { className?: string }

function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function BookIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13" />
    </Icon>
  )
}

export function TeamIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20a2 2 0 0 0 4 0" />
    </Icon>
  )
}

export function PersonIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0" />
    </Icon>
  )
}

export function EditIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </Icon>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function ListIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 6h12M4 11h12M4 16h8M17 14l4 3-4 3v-6z" />
    </Icon>
  )
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </Icon>
  )
}

export function BookmarkIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M7 4h10v16l-5-4-5 4V4z" />
    </Icon>
  )
}

export function BookmarkOffIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M7 7v13l5-4 5 4v-3M7 4h10v9M3 3l18 18" />
    </Icon>
  )
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </Icon>
  )
}