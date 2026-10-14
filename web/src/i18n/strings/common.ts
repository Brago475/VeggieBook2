// Words shared across many screens.
// Words shared across many screens.

const en = {
  back: 'Back',
  menu: 'Menu',
  cancel: 'Cancel',
  yes: 'Yes',
  close: 'Close',
  pleaseWait: 'Please wait...',
  somethingWrong: 'Something went wrong. Please try again.',
  language: 'Language',
  loading: 'Loading...',
  loadingLabel: 'Loading VeggieBook',
  veggieLogoAlt: 'VeggieBook, Quick Help for Meals',
  secretsLogoAlt: 'SecretsBook, Quick Help for Meals',
  items: (n: number, noun: 'recipe' | 'secret') =>
    `${n} ${noun}${n === 1 ? '' : 's'}`,
}

const es: typeof en = {
  back: 'Atrás',
  menu: 'Menú',
  cancel: 'Cancelar',
  yes: 'Sí',
  close: 'Cerrar',
  pleaseWait: 'Espere, por favor...',
  somethingWrong: 'Algo salió mal. Inténtelo de nuevo.',
  language: 'Idioma',
  loading: 'Cargando...',
  loadingLabel: 'Cargando VeggieBook',
  veggieLogoAlt: 'VeggieBook, ¡Sabroso! Recetas y Sugerencias',
  secretsLogoAlt: 'Libro de Secretos, ¡Sabroso! Recetas y Sugerencias',
  items: (n: number, noun: 'recipe' | 'secret') => {
    const word = noun === 'recipe' ? 'receta' : 'secreto'
    return `${n} ${word}${n === 1 ? '' : 's'}`
  },
}

export const COMMON = { en, es }