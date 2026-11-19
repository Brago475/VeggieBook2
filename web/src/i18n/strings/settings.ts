// Profile and settings: the list of settings and the frame around each
// one. The cards inside keep their own words (account.ts). Spanish uses tú.

const en = {
  settings: 'Settings',
  profile: 'Profile',
  groupAccount: 'Account',
  groupResearch: 'Research',
  security: 'Password and recovery',
  on: 'On',
  off: 'Off',
}

const es: typeof en = {
  settings: 'Ajustes',
  profile: 'Perfil',
  groupAccount: 'Cuenta',
  groupResearch: 'Investigación',
  security: 'Contraseña y recuperación',
  on: 'Activado',
  off: 'Desactivado',
}

export const SETTINGS = { en, es }