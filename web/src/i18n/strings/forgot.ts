// Forgot password, every step. Shared words (Sign in, Your answer, the
// password-mismatch message) come from auth.ts. Spanish uses tú.

const en = {
  continue: 'Continue',

  emailTitle: 'Forgot your password?',
  emailSub:
    "Enter your email. Then you'll use your recovery PIN, or your security question, to choose a new password.",

  pinTitle: 'Enter your PIN',
  pinSubBefore: 'Enter the 6-digit recovery PIN you chose for ',
  recoveryPin: 'Recovery PIN',
  enterPin: 'Enter your 6-digit PIN.',
  noPin: "I don't remember my PIN",

  questionTitle: 'Answer your security question',
  enterAnswer: 'Enter your answer.',

  resetTitle: 'Set up your account again',
  resetSub:
    "Choose a new password, a new PIN, and a new security question. Your new password can't be the same as your old one.",
  newPassword: 'New password',
  confirmNewPassword: 'Confirm new password',
  saveFinish: 'Save and finish',
  takingLong: 'Taking too long?',
  startAgain: 'Start again',

  doneTitle: 'Password changed',
  doneSub: 'You are signed out on your other devices. Sign in with your new password.',

  lockedTitle: 'Password reset is locked',
  lockedSub:
    'There were too many wrong answers, so password reset is locked for this account to keep it safe. If you still know your password, you can sign in as usual. Otherwise, please contact the VeggieBook admin.',
  backToSignIn: 'Back to sign in',
}

const es: typeof en = {
  continue: 'Continuar',

  emailTitle: '¿Olvidaste tu contraseña?',
  emailSub:
    'Escribe tu correo electrónico. Luego usarás tu PIN de recuperación, o tu pregunta de seguridad, para elegir una nueva contraseña.',

  pinTitle: 'Escribe tu PIN',
  pinSubBefore: 'Escribe el PIN de recuperación de 6 dígitos que elegiste para ',
  recoveryPin: 'PIN de recuperación',
  enterPin: 'Escribe tu PIN de 6 dígitos.',
  noPin: 'No recuerdo mi PIN',

  questionTitle: 'Responde tu pregunta de seguridad',
  enterAnswer: 'Escribe tu respuesta.',

  resetTitle: 'Configura tu cuenta de nuevo',
  resetSub:
    'Elige una nueva contraseña, un nuevo PIN y una nueva pregunta de seguridad. Tu nueva contraseña no puede ser igual a la anterior.',
  newPassword: 'Nueva contraseña',
  confirmNewPassword: 'Confirma tu nueva contraseña',
  saveFinish: 'Guardar y terminar',
  takingLong: '¿Está tardando mucho?',
  startAgain: 'Empezar de nuevo',

  doneTitle: 'Contraseña cambiada',
  doneSub: 'Se cerró tu sesión en tus otros dispositivos. Inicia sesión con tu nueva contraseña.',

  lockedTitle: 'El cambio de contraseña está bloqueado',
  lockedSub:
    'Hubo demasiadas respuestas incorrectas, así que el cambio de contraseña está bloqueado para esta cuenta por seguridad. Si todavía sabes tu contraseña, puedes iniciar sesión como siempre. Si no, comunícate con el administrador de VeggieBook.',
  backToSignIn: 'Volver a iniciar sesión',
}

export const FORGOT = { en, es }