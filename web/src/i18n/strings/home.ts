// The home screen, its menu, book cards, and the study notice. Spanish uses
// tú, with the original app's wording (vb-android values-es/strings.xml)
// where it had the same words.

const en = {
  title: 'My VeggieBooks',
  guestSub: 'Guest: your books are kept until you sign out, for up to 24 hours',
  signedInAs: (name: string) => `Signed in as ${name}`,

  about: 'About VeggieBook',
  createAccount: 'Create account',
  signIn: 'Sign in',
  endGuest: 'End guest visit',
  profile: 'Profile and settings',
  signOut: 'Sign out',

  createVeggie: 'Create New VeggieBook',
  createSecrets: 'Create New Secrets Book',
  loadingBooks: 'Loading your books...',
  empty:
    'You have not made any books yet. Start with Create New VeggieBook or Create New Secrets Book.',

  veggieBook: 'VeggieBook',
  secretsBook: 'Secrets Book',
  veggieBookName: (vegetable: string) => `${vegetable} VeggieBook`,
  secretsBookName: (category: string) => `${category} book`,
  veggieSubtitle: 'Recipes, tips and more',
  secretsSubtitle: 'Secrets to better eating',

  options: (book: string) => `Options for your ${book}`,
  deleteBook: 'Delete book',
  deleteTitle: (book: string | null) => `Delete ${book ?? 'this book'}?`,
  deleteBody: 'This action permanently deletes this book and cannot be undone.',
  couldNotDelete: 'Could not delete this book.',

  endTitle: 'End your guest visit?',
  guestBooks: (n: number) =>
    n === 0
      ? 'You have no books yet.'
      : n === 1
        ? 'This deletes your 1 book.'
        : `This deletes your ${n} books.`,
  endKeep: 'To keep them, choose Create account or Sign in instead.',
  endVisit: 'End visit',

  noticeTitle: 'A VeggieBook study is running',
  noticeText:
    'You have research tracking off. Would you like to join? Only an anonymous research ID is used, never your name or email. You can turn it off again anytime in Profile and settings.',
  noticeJoin: 'Join the study',
  noticeNotNow: 'Not now',
  noticeThanks: 'Thanks for joining.',
  noticeYourId: 'Your research ID is',
}

const es: typeof en = {
  title: 'Mis VeggieBooks',
  guestSub: 'Invitado: tus libros se guardan hasta por 24 horas',
  signedInAs: (name: string) => `Sesión iniciada como ${name}`,

  about: 'Acerca de VeggieBook',
  createAccount: 'Crear cuenta',
  signIn: 'Iniciar sesión',
  endGuest: 'Terminar visita de invitado',
  profile: 'Perfil y configuración',
  signOut: 'Cerrar sesión',

  createVeggie: 'Crear un VeggieBook Nuevo',
  createSecrets: 'Crear un Libro de Secretos',
  loadingBooks: 'Cargando tus libros...',
  empty:
    'Todavía no has hecho ningún libro. Empieza con Crear un VeggieBook Nuevo o Crear un Libro de Secretos.',

  veggieBook: 'VeggieBook',
  secretsBook: 'Libro de Secretos',
  veggieBookName: (vegetable: string) => `VeggieBook de ${vegetable}`,
  secretsBookName: (category: string) => `libro de ${category}`,
  veggieSubtitle: 'Recetas, consejos y más',
  secretsSubtitle: 'Secretos para comer mejor',

  options: (book: string) => `Opciones para tu ${book}`,
  deleteBook: 'Eliminar libro',
  deleteTitle: (book: string | null) => `¿Eliminar ${book ?? 'este libro'}?`,
  deleteBody: 'Esta acción elimina este libro para siempre y no se puede deshacer.',
  couldNotDelete: 'No se pudo eliminar este libro.',

  endTitle: '¿Terminar tu visita de invitado?',
  guestBooks: (n: number) =>
    n === 0
      ? 'Todavía no tienes libros.'
      : n === 1
        ? 'Esto elimina tu único libro.'
        : `Esto elimina tus ${n} libros.`,
  endKeep: 'Para conservarlos, elige Crear cuenta o Iniciar sesión.',
  endVisit: 'Terminar visita',

  noticeTitle: 'Hay un estudio de VeggieBook en curso',
  noticeText:
    'Tienes desactivado el seguimiento para la investigación. ¿Te gustaría participar? Solo se usa un código de investigación anónimo, nunca tu nombre ni tu correo electrónico. Puedes desactivarlo de nuevo cuando quieras en Perfil y configuración.',
  noticeJoin: 'Participar en el estudio',
  noticeNotNow: 'Ahora no',
  noticeThanks: 'Gracias por participar.',
  noticeYourId: 'Tu código de investigación es',
}

export const HOME = { en, es }