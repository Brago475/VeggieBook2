import { useState } from 'react'
import { imageUrl } from '../../utils/images'

// A picture from /images that never shows a broken-image icon: with no
// path, or one that won't load, it becomes a green VeggieBook leaf instead,
// the same idea as the app's SafeImage.

type Props = {
  path: string | null | undefined
  className?: string
  alt?: string
}

export function SafeImg({ path, className, alt = '' }: Props) {
  const [failed, setFailed] = useState<string | null>(null)
  const broken = !path || failed === path

  if (broken) {
    return (
      <span className={`${className ?? ''} is-placeholder`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20 34c-1-9 2-16 11-22-1 11-5 18-11 22z" fill="#ffffff" opacity="0.9" />
          <path d="M19 34C13 28 9 21 10 10c7 6 10 14 9 24z" fill="#ffffff" opacity="0.6" />
        </svg>
      </span>
    )
  }

  return (
    <img
      className={className}
      src={imageUrl(path)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(path)}
    />
  )
}