// Shrinks an uploaded photo in the browser before it is saved.
//
// Uploaded covers live in localStorage for now, which holds about 5 MB for
// the whole site. A phone photo can be 3 to 5 MB on its own, so it is
// center-cropped to a square and scaled to 800px to match the preset
// covers, then stored as a JPEG data URL of roughly 100 KB.
//
// Nothing is sent to the server. When books move to the API, this same
// output gets uploaded instead of stored locally.
//
// Phone photos carry a rotation flag. Current browsers apply it when
// drawing an image element, so sideways photos come out upright.

const SIZE = 800
const QUALITY = 0.8

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This photo could not be read. Try a JPEG or PNG.'))
    }
    img.src = url
  })
}

export async function resizeImage(file: File): Promise<string> {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Please choose a photo.')
  }

  const img = await loadImage(file)

  // Center crop to a square, then scale down. Never scale up, so a small
  // photo keeps its own size.
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - side) / 2
  const sy = (img.naturalHeight - side) / 2
  const out = Math.min(side, SIZE)

  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Your browser could not process this photo.')

  // JPEG has no transparency, so a transparent PNG would turn black.
  // A white background keeps it looking right.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, out, out)
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out)

  return canvas.toDataURL('image/jpeg', QUALITY)
}