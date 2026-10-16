// Making and reading a Secrets Book. NEXT, SAVE BOOK, and the cover buttons
// come from flow.ts and covers.ts. KEEP and DROP are here because Spanish
// uses the masculine form for a secret (LO QUIERO), as the original app
// did. Spanish uses tú, with the original app's wording (vb-android
// values-es/strings.xml and secret_mobile_es.html) where it had the same
// words.

const en = {
  chooseTitle: 'Choose the Secrets You Want',
  loadingKinds: 'Loading the kinds of secrets...',
  couldNotLoad: (error: string) => `Could not load: ${error}`,
  whoSaysSo: 'Who Says So?',

  keep: 'KEEP',
  drop: 'DROP',
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
  chooseTitle: 'Elegir una clase de Secretos',
  loadingKinds: 'Cargando las clases de secretos...',
  couldNotLoad: (error: string) => `No se pudo cargar: ${error}`,
  whoSaysSo: '¿Quién lo dice?',

  keep: 'LO QUIERO',
  drop: 'NO LO QUIERO',
  gettingCategory: (category: string) => `Estamos buscando tus ${category}.`,
  reviewEach: (keep: string, drop: string) =>
    `A continuación, revisa cada secreto y elige ${keep} o ${drop}.`,
  loadError: 'No pudimos cargar estos secretos en este momento. Regresa e inténtalo de nuevo.',
  noSecrets: 'Todavía no hay secretos en esta clase.',

  noneKept: 'No escogiste ningún secreto',
  noneText: (category: string) =>
    `No escogiste ningún secreto de ${category}. Un Libro de Secretos necesita al menos un secreto.`,
  chooseAnother: 'ELEGIR OTRA',
  reviewAgain: 'REVISAR DE NUEVO',

  extraIntro:
    'Puedes imprimir una COPIA EXTRA de cualquier secreto para dárselo a familiares o amigos.',
  extraTouch: 'Solo selecciona los secretos de los que quieras una COPIA EXTRA.',

  chooseCoverLabel: 'Escoge una portada',
  noPictures:
    'Tus secretos no tienen imágenes para usar como portada. Elige otra clase de secretos.',
  chooseCover: () => 'Ahora escoge la portada para tu Libro de Secretos.',
  browseBy: 'Ver portadas por clase de secreto',
  pictureLabel: (category: string, n: number) => `Imagen de secreto de ${category} ${n}`,
  secretFallback: 'Secreto',

  counter: (position: number, total: number) => `Secreto ${position} de ${total}`,
  whyItWorks: 'Por qué funciona',
  additional: 'Información adicional',
  planner: 'Planificador para imprimir (PDF)',
}

export const SECRETS = { en, es }