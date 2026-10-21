import { useState } from 'react'
import { AUTO_SIZES, isSizable, sizedSrcSet, useImageManifest } from '../../utils/imageSizes'

// A plain photo that uses the smaller copies when they exist. Tries the
// copies, then the original, then calls onFail. For grids that drop a
// broken tile instead of showing the logo; elsewhere use SafeImage.

type Props = {
  src: string
  onFail?: () => void
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export function SizedImg({ src, onFail, alt = '', className, loading = 'lazy' }: Props) {
  const manifest = useImageManifest()
  const [plainFor, setPlainFor] = useState<string | null>(null)

  if (manifest === null && isSizable(src)) {
    return <img className={className} alt={alt} loading={loading} />
  }

  const srcSet = plainFor === src ? undefined : sizedSrcSet(src, manifest)

  return (
    <img
      key={srcSet ? 'sized' : 'plain'}
      className={className}
      alt={alt}
      loading={loading}
      sizes={srcSet ? AUTO_SIZES : undefined}
      srcSet={srcSet}
      src={src}
      onError={() => {
        if (srcSet) setPlainFor(src)
        else onFail?.()
      }}
    />
  )
}