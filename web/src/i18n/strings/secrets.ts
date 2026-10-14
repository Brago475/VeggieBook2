// Making and reading a Secrets Book. The bottom buttons (NEXT, KEEP, DROP,
// SAVE BOOK) come from flow.ts, and the cover buttons from covers.ts, so
// both kinds of book use the same words.

const en = {
  chooseTitle: 'Choose the Secrets You Want',
  loadingKinds: 'Loading the kinds of secrets...',
  couldNotLoad: (error: string) => `Could not load: ${error}`,
  whoSaysSo: 'Who Says So?',

  gettingCategory: (category: string) => `We are getting ${category}.`,
  reviewEach: (keep: string, drop: string) =>
    `You can review each Secret and ${keep} or ${drop} it.`,
  loadError: 'We could not load these secrets right now. Please go back and try again.',
  noSecrets: 'There are no secrets in this category yet.',

  noneKept: 'No Secrets Kept',
  noneText: (category: string) =>
    `You did not keep any ${category}. A Secrets Book needs at least one secret.`,
  chooseAnother: 'CHOOSE ANOTHER',
  reviewAgain: 'REVIEW AGAIN',

  extraIntro: 'You can print an EXTRA COPY of any secret to give to family or friends.',
  extraTouch: 'Just touch a secret for an EXTRA COPY.',

  chooseCoverLabel: 'Choose a Cover',
  noPictures:
    'Your secrets have no pictures to use as a cover. Please choose a different kind of secret.',
  chooseCover: (category: string) => `Choose a cover for your ${category} book.`,
  browseBy: 'Browse covers by kind of secret',
  pictureLabel: (category: string, n: number) => `${category} secret picture ${n}`,
  secretFallback: 'Secret',

  counter: (position: number, total: number) => `Secret ${position} of ${total}`,
  whyItWorks: 'Why It Works',
  additional: 'Additional Information',
  planner: 'Printable planner (PDF)',
}

const es: typeof en = {
  chooseTitle: 'Elija los secretos que quiere',
  loadingKinds: 'Cargando los tipos de secretos...',
  couldNotLoad: (error: string) => `No se pudo cargar: ${error}`,
  whoSaysSo: '¿Quién lo dice?',

  gettingCategory: (category: string) => `Estamos buscando sus ${category}.`,
  reviewEach: (keep: string, drop: string) =>
    `Puede revisar cada secreto y elegir ${keep} o ${drop}.`,
  loadError: 'No pudimos cargar estos secretos en este momento. Regrese e inténtelo de nuevo.',
  noSecrets: 'Todavía no hay secretos en esta categoría.',

  noneKept: 'No conservó ningún secreto',
  noneText: (category: string) =>
    `No conservó ningún secreto de la categoría ${category}. Un Secrets Book necesita al menos un secreto.`,
  chooseAnother: 'ELEGIR OTRA',
  reviewAgain: 'REVISAR DE NUEVO',

  extraIntro:
    'Puede imprimir una COPIA EXTRA de cualquier secreto para dársela a su familia o amigos.',
  extraTouch: 'Solo toque un secreto para pedir una COPIA EXTRA.',

  chooseCoverLabel: 'Elija una portada',
  noPictures:
    'Sus secretos no tienen imágenes para usar como portada. Elija otro tipo de secreto.',
  chooseCover: (category: string) => `Elija una portada para su libro de ${category}.`,
  browseBy: 'Ver portadas por tipo de secreto',
  pictureLabel: (category: string, n: number) => `Imagen de secreto de ${category} ${n}`,
  secretFallback: 'Secreto',

  counter: (position: number, total: number) => `Secreto ${position} de ${total}`,
  whyItWorks: 'Por qué funciona',
  additional: 'Información adicional',
  planner: 'Planificador para imprimir (PDF)',
}

export const SECRETS = { en, es }