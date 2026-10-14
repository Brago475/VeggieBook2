// Making a VeggieBook: picker, questions, transition, review, extra copies,
// the cover screen, and the bottom buttons. The transition text names the
// KEEP and DROP buttons, so it is built from the same words. Spanish
// follows the original app (vb-android values-es/strings.xml and
// recipes_loading_es.html) where it had the same words.

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
  selectBook: 'Seleccione una Verdura',
  loading: 'Cargando...',
  next: 'SIGUIENTE',
  keep: 'LA QUIERO',
  drop: 'NO LA QUIERO',
  noRecipes: 'No pudimos encontrar recetas en este momento. Regrese e inténtelo de nuevo.',
  gettingRecipes: 'Estamos creando su VeggieBook.',
  reviewEach: (keep: string, drop: string) =>
    `A continuación, revise cada receta y elija ${keep} o ${drop}.`,
  pressNext: (next: string) => `Pulse ${next} abajo para continuar.`,
  noMatches: 'Ninguna receta coincide con sus respuestas.',

  extraIntro:
    'Usted puede imprimir una COPIA EXTRA de cualquier receta para dársela a familiares o amigos.',
  extraTouch: 'Solo seleccione las recetas de las que quiera una COPIA EXTRA.',

  chooseCover: (vegetable: string) => `Ahora escoja la portada para su VeggieBook de ${vegetable}.`,
  saveBook: 'GUARDAR LIBRO',
  saving: 'GUARDANDO...',
  couldNotSave: 'No se pudo guardar su libro. Inténtelo de nuevo.',
}

export const FLOW = { en, es }