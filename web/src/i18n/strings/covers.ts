// Choosing a VeggieBook cover, when making a book or changing a saved one.
// Spanish follows the original app where it had the same words.

const en = {
  useDefault: 'Use default cover',
  choose: 'Choose a cover',
  uploadOwn: 'Upload your own cover',
  uploadDifferent: 'Upload a different cover',
  browseBy: 'Browse covers by vegetable',
  loadingCovers: 'Loading covers...',
  preparing: 'Preparing your photo...',
  photoUnusable: 'This photo could not be used.',
  coverLabel: (vegetable: string) => `${vegetable} cover`,
  photoLabel: (vegetable: string) => `${vegetable} photo`,
  recipePhotoLabel: (vegetable: string) => `${vegetable} recipe photo`,
}

const es: typeof en = {
  useDefault: 'Usar la portada predeterminada',
  choose: 'Escoger una portada',
  uploadOwn: 'Usar su propia foto',
  uploadDifferent: 'Usar otra foto',
  browseBy: 'Ver portadas por verdura',
  loadingCovers: 'Cargando portadas...',
  preparing: 'Subiendo su foto...',
  photoUnusable: 'No se pudo usar esta foto.',
  coverLabel: (vegetable: string) => `Portada de ${vegetable}`,
  photoLabel: (vegetable: string) => `Foto de ${vegetable}`,
  recipePhotoLabel: (vegetable: string) => `Foto de receta de ${vegetable}`,
}

export const COVERS = { en, es }