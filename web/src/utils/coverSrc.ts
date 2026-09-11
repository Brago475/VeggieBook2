// A book's cover comes in one of three forms, and this turns any of them
// into something an <img> can display:
//
//   cover/BR.jpg            a preset, served from /images
//   /api/books/{id}/cover   a saved upload, private to its owner
//   data:image/jpeg;...     an upload not saved yet (guest, or preview)

export function coverSrc(image: string): string {
  if (image.startsWith('data:') || image.startsWith('/')) return image
  return `/images/${image}`
}