import type { SecretCategory } from '../types'
import { SafeImage } from './SafeImage'

// One row in the Secrets category picker, matching the original app: the
// category's illustration on the left (toaster, sandwich, plate, fruit
// bowl, cart), its name on the right. The whole row is a button so the tap
// target is the full width.
//
// The illustrations are drawings on a transparent background, not photos,
// so they are shown whole (secrets.css) rather than cropped to fill like
// the vegetable thumbnails.

type Props = {
  category: SecretCategory
  onSelect: (category: SecretCategory) => void
}

export function SecretCategoryRow({ category, onSelect }: Props) {
  return (
    <button
      type="button"
      className="secret-row"
      onClick={() => onSelect(category)}
    >
      <SafeImage className="secret-row-icon" src={`/images/${category.image}`} />
      <span className="secret-row-name">{category.name}</span>
    </button>
  )
}