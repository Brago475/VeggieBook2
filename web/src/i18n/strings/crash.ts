// The crash screen (components/common/CrashScreen.tsx). Spanish uses tú.

const en = {
  title: 'Something went wrong',
  text: 'This page ran into a problem. Your saved books are safe. Reload the page, or go back to the home screen.',
  reload: 'Reload page',
  home: 'Go to home',
}

const es: typeof en = {
  title: 'Algo salió mal',
  text: 'Esta página tuvo un problema. Tus libros guardados están a salvo. Vuelve a cargar la página o regresa a la pantalla de inicio.',
  reload: 'Volver a cargar',
  home: 'Ir al inicio',
}

export const CRASH = { en, es }