// Making a VeggieBook: picker, questions, transition, review, extra copies,
// the cover screen, and the bottom buttons. The transition text names the
// KEEP and DROP buttons, so it is built from the same words. Spanish uses
// tú, with the original app's wording (vb-android values-es/strings.xml and
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
  selectBook: 'Selecciona una Verdura',
  loading: 'Cargando...',
  next: 'SIGUIENTE',
  keep: 'LA QUIERO',
  drop: 'NO LA QUIERO',
  noRecipes: 'No pudimos encontrar recetas en este momento. Regresa e inténtalo de nuevo.',
  gettingRecipes: 'Estamos creando tu VeggieBook.',
  reviewEach: (keep: string, drop: string) =>
    `A continuación, revisa cada receta y elige ${keep} o ${drop}.`,
  pressNext: (next: string) => `Pulsa ${next} abajo para continuar.`,
  noMatches: 'Ninguna receta coincide con tus respuestas.',

  extraIntro:
    'Puedes imprimir una COPIA EXTRA de cualquier receta para dársela a familiares o amigos.',
  extraTouch: 'Solo selecciona las recetas de las que quieras una COPIA EXTRA.',

  chooseCover: (vegetable: string) => `Ahora escoge la portada para tu VeggieBook de ${vegetable}.`,
  saveBook: 'GUARDAR LIBRO',
  saving: 'GUARDANDO...',
  couldNotSave: 'No se pudo guardar tu libro. Inténtalo de nuevo.',
}

export const FLOW = { en, es }