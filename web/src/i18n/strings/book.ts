// A saved book: the viewers for both kinds of book and the change-cover
// screens. Book names, the ⋮ label, and the delete-book wording come from
// home.ts so they read the same everywhere. Spanish uses tú.

const en = {
  your: 'Your',
  veggieLabel: 'VeggieBook',
  secretsLabel: 'Secrets Book',
  secretsFallback: 'Secrets',

  changeCover: 'Change cover',
  printBook: 'Print book',
  downloadBook: 'Download book',
  printRecipe: 'Print recipe',
  downloadRecipe: 'Download recipe',
  printSecret: 'Print secret',
  downloadSecret: 'Download secret',
  deleteRecipe: 'Delete recipe',
  deleteSecret: 'Delete secret',
  optionsFor: (title: string) => `Options for ${title}`,
  deleteNamed: (name: string) => `Delete ${name}?`,
  deleteQuoted: (title: string) => `Delete "${title}"?`,
  removeRecipeBody: 'This removes the recipe from this book. It cannot be undone.',
  removeSecretBody: 'This removes the secret from this book. It cannot be undone.',

  couldNotOpen: 'Could not open this book.',
  noLongerAvailable: 'This book is no longer available.',
  backToBooks: 'Back to my books',
  backToBook: 'Back to the book',
  recipeNotLoaded: 'This recipe could not be loaded.',
  secretGone: 'This secret is no longer in this book.',
  backToBookButton: 'BACK TO BOOK',

  newCoverVeggie: (vegetable: string) => `Choose a new cover for your ${vegetable} VeggieBook.`,
  newCoverSecrets: (category: string) => `Choose a new cover for your ${category} book.`,
  cancel: 'CANCEL',
  saveCover: 'SAVE COVER',
  coverNotSaved: 'The cover could not be saved. Please try again.',
}

const es: typeof en = {
  your: 'Tu',
  veggieLabel: 'VeggieBook',
  secretsLabel: 'Libro de Secretos',
  secretsFallback: 'Secretos',

  changeCover: 'Cambiar la portada',
  printBook: 'Imprimir libro',
  downloadBook: 'Descargar libro',
  printRecipe: 'Imprimir receta',
  downloadRecipe: 'Descargar receta',
  printSecret: 'Imprimir secreto',
  downloadSecret: 'Descargar secreto',
  deleteRecipe: 'Eliminar receta',
  deleteSecret: 'Eliminar secreto',
  optionsFor: (title: string) => `Opciones para ${title}`,
  deleteNamed: (name: string) => `¿Eliminar ${name}?`,
  deleteQuoted: (title: string) => `¿Eliminar "${title}"?`,
  removeRecipeBody: 'Esto quita la receta de este libro. No se puede deshacer.',
  removeSecretBody: 'Esto quita el secreto de este libro. No se puede deshacer.',

  couldNotOpen: 'No se pudo abrir este libro.',
  noLongerAvailable: 'Este libro ya no está disponible.',
  backToBooks: 'Volver a mis libros',
  backToBook: 'Volver al libro',
  recipeNotLoaded: 'No se pudo cargar esta receta.',
  secretGone: 'Este secreto ya no está en este libro.',
  backToBookButton: 'VOLVER AL LIBRO',

  newCoverVeggie: (vegetable: string) =>
    `Escoge una nueva portada para tu VeggieBook de ${vegetable}.`,
  newCoverSecrets: () => 'Escoge una nueva portada para tu Libro de Secretos.',
  cancel: 'CANCELAR',
  saveCover: 'GUARDAR PORTADA',
  coverNotSaved: 'No se pudo guardar la portada. Inténtalo de nuevo.',
}

export const BOOK = { en, es }