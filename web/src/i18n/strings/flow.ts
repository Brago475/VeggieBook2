// Making a VeggieBook: picker, questions, transition, review, extra copies,
// the cover screen, and the bottom buttons. The transition text names the
// KEEP and DROP buttons, so it is built from the same words.

const en = {
  selectBook: 'Select VeggieBook',
  loading: 'Loading...',
  next: 'NEXT',
  keep: 'KEEP',
  drop: 'DROP',
  noRecipes: 'We could not find recipes right now. Please go back and try again.',
  gettingRecipes: 'We are getting your recipes.',
  reviewEach: (keep: string, drop: string) =>
    `You can review each recipe and ${keep} or ${drop} it.`,
  pressNext: (next: string) => `Press ${next} below to continue`,
  noMatches: 'No recipes matched your choices.',

  extraIntro: 'You can print an EXTRA COPY of any recipe to give to family or friends.',
  extraTouch: 'Just touch a recipe for an EXTRA COPY.',

  chooseCover: (vegetable: string) => `Choose a cover for your ${vegetable} VeggieBook.`,
  saveBook: 'SAVE BOOK',
  saving: 'SAVING...',
  couldNotSave: 'Your book could not be saved. Please try again.',
}

const es: typeof en = {
  selectBook: 'Elija su VeggieBook',
  loading: 'Cargando...',
  next: 'SIGUIENTE',
  keep: 'CONSERVAR',
  drop: 'DESCARTAR',
  noRecipes: 'No pudimos encontrar recetas en este momento. Regrese e inténtelo de nuevo.',
  gettingRecipes: 'Estamos buscando sus recetas.',
  reviewEach: (keep: string, drop: string) =>
    `Puede revisar cada receta y elegir ${keep} o ${drop}.`,
  pressNext: (next: string) => `Presione ${next} abajo para continuar`,
  noMatches: 'Ninguna receta coincide con sus respuestas.',

  extraIntro:
    'Puede imprimir una COPIA EXTRA de cualquier receta para dársela a su familia o amigos.',
  extraTouch: 'Solo toque una receta para pedir una COPIA EXTRA.',

  chooseCover: (vegetable: string) => `Elija una portada para su VeggieBook de ${vegetable}.`,
  saveBook: 'GUARDAR LIBRO',
  saving: 'GUARDANDO...',
  couldNotSave: 'No se pudo guardar su libro. Inténtelo de nuevo.',
}

export const FLOW = { en, es }