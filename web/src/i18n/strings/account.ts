// Profile and settings: the page and its cards (profile, change password,
// password recovery, help with research, delete account). Shared field
// labels come from auth.ts and forgot.ts. Spanish uses tú.

const en = {
  tagline: 'Manage your account and preferences.',
  signingOut: 'Signing out...',
  signOutNote: "You'll be signed out on this device.",
  loadCardError: 'Could not load this card.',
  saving: 'Saving...',

  profileTitle: 'Profile',
  signedInWith: (email: string) => `Signed in with ${email}`,
  profileFallback: 'Your name and username.',
  loadProfileError: 'Could not load your profile.',
  username: 'Username',
  usernameHint:
    '3 to 20 letters, numbers, or underscores. This is the name shown on your home screen.',
  enterUsername: 'Please enter a username.',
  profileSaved: 'Profile saved.',
  saveProfile: 'Save profile',

  cpTitle: 'Change password',
  cpVerify: 'First, confirm it is you.',
  cpChoose: 'Now choose your new password.',
  currentPassword: 'Current password',
  enterCurrent: 'Enter your current password.',
  yourPin: 'Your 6-digit recovery PIN',
  checking: 'Checking...',
  usePin: 'Forgot your current password? Use your PIN instead',
  usePassword: 'Use my current password instead',
  newPasswordPlaceholder: 'Enter a new password',
  changing: 'Changing...',
  cpDone: 'Password changed. You were signed out on your other devices.',

  rcTitle: 'Password recovery',
  rcLoading: 'Your recovery PIN and security question.',
  rcSet:
    'Your recovery PIN and security question are set. You use them if you forget your password.',
  rcNotSet:
    'Set a recovery PIN and security question so you can reset a forgotten password.',
  rcYourQuestion: 'Your question:',
  rcSaved: 'Saved. Use your new PIN and question if you forget your password.',
  rcChange: 'Change PIN and question',
  rcSetButton: 'Set PIN and question',
  rcNewPin: 'New 6-digit PIN',
  rcPinHint: 'Avoid easy ones like 123456 or 111111.',
  rcSave: 'Save PIN and question',

  rsTitle: 'Help with research',
  rsLoading: 'Research tracking for your account.',
  rsOn:
    'Your saved books help the VeggieBook research team at Kean University. They only see an anonymous research ID, never your name or email.',
  rsOffAdmin:
    'The research team turned research tracking off for your account. Nothing you save is used for research.',
  rsOff:
    'Research tracking is off. Nothing you save from now on is used for research. You can turn it back on anytime.',
  rsChipOn: 'Tracking on',
  rsChipLocked: 'Turned off by the research team',
  rsChipOff: 'Tracking off',
  rsYourId: 'Your anonymous research ID',
  rsDoneOn: 'Research tracking is on. Thank you for helping.',
  rsDoneOff: 'Research tracking is off.',
  rsTurnOff: 'Turn off research tracking',
  rsTurningOn: 'Turning on...',
  rsTurnOn: 'Turn research tracking on',
  rsAdminHint:
    'Only the research team can turn it back on. Questions? Contact the research team through the About page.',
  rsConfirmTitle: 'Turn off research tracking?',
  rsConfirmBody:
    'From now on, nothing you save is used for research. Books you saved before stay part of the research. You can turn it back on anytime.',
  rsConfirmYes: 'Turn it off',
  rsConfirmNo: 'Keep it on',

  delTitle: 'Delete account',
  delText:
    'This permanently deletes your account, all of your books, and any photos you uploaded. It cannot be undone.',
  delButton: 'Delete my account',
  delConfirmLabel: 'Enter your password to confirm',
  delEnterPassword: 'Enter your password to confirm.',
  deleting: 'Deleting...',
  delFinal: 'Permanently delete my account',
}

const es: typeof en = {
  tagline: 'Administra tu cuenta y tus preferencias.',
  signingOut: 'Cerrando sesión...',
  signOutNote: 'Se cerrará tu sesión en este dispositivo.',
  loadCardError: 'No se pudo cargar esta sección.',
  saving: 'Guardando...',

  profileTitle: 'Perfil',
  signedInWith: (email: string) => `Sesión iniciada con ${email}`,
  profileFallback: 'Tu nombre y nombre de usuario.',
  loadProfileError: 'No se pudo cargar tu perfil.',
  username: 'Nombre de usuario',
  usernameHint:
    'De 3 a 20 letras, números o guiones bajos. Es el nombre que se muestra en tu pantalla de inicio.',
  enterUsername: 'Escribe un nombre de usuario.',
  profileSaved: 'Perfil guardado.',
  saveProfile: 'Guardar perfil',

  cpTitle: 'Cambiar contraseña',
  cpVerify: 'Primero, confirma que eres tú.',
  cpChoose: 'Ahora elige tu nueva contraseña.',
  currentPassword: 'Contraseña actual',
  enterCurrent: 'Escribe tu contraseña actual.',
  yourPin: 'Tu PIN de recuperación de 6 dígitos',
  checking: 'Verificando...',
  usePin: '¿Olvidaste tu contraseña actual? Usa tu PIN',
  usePassword: 'Usar mi contraseña actual',
  newPasswordPlaceholder: 'Escribe una nueva contraseña',
  changing: 'Cambiando...',
  cpDone: 'Contraseña cambiada. Se cerró tu sesión en tus otros dispositivos.',

  rcTitle: 'Recuperación de contraseña',
  rcLoading: 'Tu PIN de recuperación y tu pregunta de seguridad.',
  rcSet:
    'Tu PIN de recuperación y tu pregunta de seguridad están listos. Los usas si olvidas tu contraseña.',
  rcNotSet:
    'Configura un PIN de recuperación y una pregunta de seguridad para poder cambiar una contraseña olvidada.',
  rcYourQuestion: 'Tu pregunta:',
  rcSaved: 'Guardado. Usa tu nuevo PIN y tu nueva pregunta si olvidas tu contraseña.',
  rcChange: 'Cambiar PIN y pregunta',
  rcSetButton: 'Configurar PIN y pregunta',
  rcNewPin: 'Nuevo PIN de 6 dígitos',
  rcPinHint: 'Evita uno fácil como 123456 o 111111.',
  rcSave: 'Guardar PIN y pregunta',

  rsTitle: 'Ayuda con la investigación',
  rsLoading: 'El seguimiento para la investigación de tu cuenta.',
  rsOn:
    'Tus libros guardados ayudan al equipo de investigación de VeggieBook en Kean University. Solo ven un código de investigación anónimo, nunca tu nombre ni tu correo electrónico.',
  rsOffAdmin:
    'El equipo de investigación desactivó el seguimiento para tu cuenta. Nada de lo que guardes se usa para la investigación.',
  rsOff:
    'El seguimiento para la investigación está desactivado. Nada de lo que guardes a partir de ahora se usa para la investigación. Puedes volver a activarlo cuando quieras.',
  rsChipOn: 'Seguimiento activado',
  rsChipLocked: 'Desactivado por el equipo de investigación',
  rsChipOff: 'Seguimiento desactivado',
  rsYourId: 'Tu código de investigación anónimo',
  rsDoneOn: 'El seguimiento para la investigación está activado. Gracias por ayudar.',
  rsDoneOff: 'El seguimiento para la investigación está desactivado.',
  rsTurnOff: 'Desactivar el seguimiento para la investigación',
  rsTurningOn: 'Activando...',
  rsTurnOn: 'Activar el seguimiento para la investigación',
  rsAdminHint:
    'Solo el equipo de investigación puede volver a activarlo. ¿Preguntas? Comunícate con el equipo de investigación desde la página Acerca de.',
  rsConfirmTitle: '¿Desactivar el seguimiento para la investigación?',
  rsConfirmBody:
    'A partir de ahora, nada de lo que guardes se usa para la investigación. Los libros que guardaste antes siguen siendo parte de la investigación. Puedes volver a activarlo cuando quieras.',
  rsConfirmYes: 'Desactivarlo',
  rsConfirmNo: 'Mantenerlo activado',

  delTitle: 'Eliminar cuenta',
  delText:
    'Esto elimina para siempre tu cuenta, todos tus libros y las fotos que subiste. No se puede deshacer.',
  delButton: 'Eliminar mi cuenta',
  delConfirmLabel: 'Escribe tu contraseña para confirmar',
  delEnterPassword: 'Escribe tu contraseña para confirmar.',
  deleting: 'Eliminando...',
  delFinal: 'Eliminar mi cuenta para siempre',
}

export const ACCOUNT = { en, es }