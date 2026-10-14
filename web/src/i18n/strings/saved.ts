// The screen shown right after a book is saved. When recipes or secrets
// were picked for extra copies, it offers those; otherwise the whole book.
// Spanish uses tú.

type Noun = 'recipe' | 'secret'

const en = {
  title: (noun: Noun): string =>
    noun === 'secret' ? 'Your secrets are saved' : 'Your book is saved',
  sub: 'Want a copy you can hold?',
  loading: 'Loading...',

  extraOne: (noun: Noun): string =>
    `You picked an extra copy of this ${noun} to give to family or friends.`,
  extraMany: (n: number, noun: Noun): string =>
    `You picked ${n} ${noun}s for extra copies. Want them together in one file?`,
  printOne: (noun: Noun): string => (noun === 'secret' ? 'PRINT SECRET' : 'PRINT RECIPE'),
  downloadOne: (noun: Noun): string =>
    noun === 'secret' ? 'DOWNLOAD SECRET' : 'DOWNLOAD RECIPE',
  printMany: (n: number, noun: Noun): string =>
    `PRINT ${n} ${noun === 'secret' ? 'SECRETS' : 'RECIPES'}`,
  downloadMany: (n: number, noun: Noun): string =>
    `DOWNLOAD ${n} ${noun === 'secret' ? 'SECRETS' : 'RECIPES'}`,
  done: 'Done, go to my books',
  bookLater: 'You can print or download the whole book anytime from the ⋮ on your book.',

  printBook: 'PRINT BOOK',
  downloadBook: 'DOWNLOAD BOOK',
  skip: 'Skip, go to my books',
}

const es: typeof en = {
  title: (noun: Noun) =>
    noun === 'secret' ? 'Tus secretos están guardados' : 'Tu libro está guardado',
  sub: '¿Quieres una copia en papel?',
  loading: 'Cargando...',

  extraOne: (noun: Noun) =>
    noun === 'secret'
      ? 'Escogiste una copia extra de este secreto para dársela a familiares o amigos.'
      : 'Escogiste una copia extra de esta receta para dársela a familiares o amigos.',
  extraMany: (n: number, noun: Noun) =>
    noun === 'secret'
      ? `Escogiste ${n} secretos para copias extra. ¿Los quieres juntos en un solo archivo?`
      : `Escogiste ${n} recetas para copias extra. ¿Las quieres juntas en un solo archivo?`,
  printOne: (noun: Noun) => (noun === 'secret' ? 'IMPRIMIR SECRETO' : 'IMPRIMIR RECETA'),
  downloadOne: (noun: Noun) => (noun === 'secret' ? 'DESCARGAR SECRETO' : 'DESCARGAR RECETA'),
  printMany: (n: number, noun: Noun) =>
    `IMPRIMIR ${n} ${noun === 'secret' ? 'SECRETOS' : 'RECETAS'}`,
  downloadMany: (n: number, noun: Noun) =>
    `DESCARGAR ${n} ${noun === 'secret' ? 'SECRETOS' : 'RECETAS'}`,
  done: 'Listo, ir a mis libros',
  bookLater: 'Puedes imprimir o descargar el libro completo cuando quieras desde el ⋮ de tu libro.',

  printBook: 'IMPRIMIR LIBRO',
  downloadBook: 'DESCARGAR LIBRO',
  skip: 'Omitir, ir a mis libros',
}

export const SAVED = { en, es }