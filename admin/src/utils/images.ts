// Built-in pictures (vegetables, covers, recipe photos, Secrets artwork)
// are public files under /images, the same as on the public site. The API
// gives their paths without the /images prefix.

export function imageUrl(path: string): string {
  return `/images/${path.replace(/^\/+/, '')}`
}