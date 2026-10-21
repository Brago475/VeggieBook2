import { useSyncExternalStore } from 'react'

// Smaller WebP copies of /images photos, made by scripts/make_sized_images.py.
// The manifest maps an original path to the widths that have a copy:
//   { "recipe/BR-202/photo1.jpg": [400, 800, 1200] }
// Photos missing from it have no useful copies and use the original.

const MANIFEST_URL = '/images/_sized/manifest.json'
const PREFIX = '/images/'
const TIMEOUT_MS = 4000

type Manifest = Record<string, number[]>

let manifest: Manifest | null = null
const listeners = new Set<() => void>()

function settle(data: unknown) {
  manifest = data && typeof data === 'object' ? (data as Manifest) : {}
  listeners.forEach((listener) => listener())
}

// Loaded once per page. no-cache revalidates, so a new script run is picked up.
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
fetch(MANIFEST_URL, { cache: 'no-cache', signal: controller.signal })
  .then((response) => (response.ok ? response.json() : {}))
  .catch(() => ({}))
  .then((data) => {
    clearTimeout(timer)
    settle(data)
  })

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The manifest, or null while it is still loading. */
export function useImageManifest(): Manifest | null {
  return useSyncExternalStore(subscribe, () => manifest)
}

/** True when src is a /images photo that should wait for the manifest. */
export function isSizable(src: string | null | undefined): src is string {
  return Boolean(src && src.startsWith(PREFIX) && !src.startsWith(PREFIX + '_sized/'))
}

// Commas separate srcset entries, so they are encoded along with spaces.
function encodePath(path: string): string {
  return encodeURI(path).replace(/,/g, '%2C')
}

/** A srcset of the copies for src, or undefined when there are none. */
export function sizedSrcSet(src: string, current: Manifest | null): string | undefined {
  if (!current || !isSizable(src)) return undefined
  const path = src.slice(PREFIX.length)
  const widths = current[path]
  if (!widths || widths.length === 0) return undefined

  const base = path.replace(/\.[^./]+$/, '')
  return widths
    .map((w) => `${encodePath(`${PREFIX}_sized/${w}/${base}.webp`)} ${w}w`)
    .join(', ')
}

// "auto" uses the image's real width on screen (lazy images, supporting
// browsers). Others fall back to the screen width.
export const AUTO_SIZES = 'auto, 100vw'