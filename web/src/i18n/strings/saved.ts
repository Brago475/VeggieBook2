// The screen shown right after a book is saved: print it, download it, or
// go on to the library. Spanish uses tú.

const en = {
  title: 'Your book is saved',
  sub: 'Want a copy you can hold?',
  print: 'PRINT',
  download: 'DOWNLOAD PDF',
  skip: 'Skip, go to my books',
}

const es: typeof en = {
  title: 'Tu libro está guardado',
  sub: '¿Quieres una copia en papel?',
  print: 'IMPRIMIR',
  download: 'DESCARGAR PDF',
  skip: 'Omitir, ir a mis libros',
}

export const SAVED = { en, es }