import { StatIcon } from '../icons/StatIcons'

// The "See all" pill in a panel header.

type Props = {
  onClick: () => void
  label?: string
}

export function SeeAllButton({ onClick, label = 'See all' }: Props) {
  return (
    <button type="button" className="see-all" onClick={onClick}>
      {label}
      <StatIcon name="chevron" size={16} />
    </button>
  )
}