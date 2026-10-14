// Making a VeggieBook: picker, questions, transition, and the bottom
// buttons. The transition text names the KEEP and DROP buttons, so it is
// built from the same words.

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
}

export const FLOW = { en, es }