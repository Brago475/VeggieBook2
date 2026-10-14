// Welcome, the first screen for a visitor. Spanish uses tú.

const en = {
  sub: 'Make your own recipe book for the vegetable you already have.',
  createAccount: 'Create account',
  signIn: 'Sign in',
  or: 'or',
  guest: 'Continue as guest',
  guestNote: 'As a guest, your books are kept until you sign out, for up to 24 hours.',
  stepsTitle: 'How VeggieBook works',
  steps: ['Pick what you have', 'Discover recipes', 'Build your book'],
}

const es: typeof en = {
  sub: 'Haz tu propio libro de recetas con la verdura que ya tienes.',
  createAccount: 'Crear cuenta',
  signIn: 'Iniciar sesión',
  or: 'o',
  guest: 'Continuar como invitado',
  guestNote:
    'Como invitado, tus libros se guardan hasta que cierres la sesión, por un máximo de 24 horas.',
  stepsTitle: 'Cómo funciona VeggieBook',
  steps: ['Elige lo que tienes', 'Descubre recetas', 'Arma tu libro'],
}

export const WELCOME = { en, es }