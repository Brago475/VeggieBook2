// Sign in, Create account, and the pieces they share: the page frame, the
// email and password boxes, the guest-books choice, the terms checkbox,
// and the recovery PIN and question fields. Spanish uses tú.

const en = {
  back: 'Back',

  welcomeBack: 'Welcome back',
  signInSub: 'Sign in to get back to the books you saved.',
  password: 'Password',
  forgot: 'Forgot your password?',
  signIn: 'Sign in',
  newHere: 'New here?',
  createAnAccount: 'Create an account',

  createTitle: 'Create an account',
  createSub: 'Your books are kept in your account, on any device.',
  aboutYou: 'About you',
  firstName: 'First name',
  lastName: 'Last name',
  usernameOptional: 'Username (optional)',
  usernameHint:
    "3 to 20 letters, numbers, or underscores. Leave it blank and we'll make one for you.",
  signInDetails: 'Sign-in details',
  email: 'Email address',
  confirmEmail: 'Confirm email address',
  confirmPassword: 'Confirm password',
  ageRange: 'Age range',
  chooseAge: 'Choose your age range',
  recoveryTitle: 'Account recovery',
  recoveryText:
    "If you forget your password, you'll use your PIN, or your security question if you forget the PIN too. Keep them to yourself.",
  createAccount: 'Create account',
  haveAccount: 'Already have an account?',

  enterEmail: 'Enter your email address.',
  emailsDiffer: 'The two email addresses do not match.',
  passwordsDiffer: 'The two passwords do not match.',
  chooseAgeError: 'Please choose your age range.',
  agreeError:
    'Please confirm you are 18 or older and agree to the Terms of Use and Privacy Policy.',

  showPassword: 'Show password',
  hidePassword: 'Hide password',

  guestBooks: 'Your guest books',
  keepBooks: (n: number) => (n === 1 ? 'Keep my 1 book' : `Keep my ${n} books`),
  keepBooksSub: 'They move into this account right away.',
  startFresh: 'Start fresh',
  startFreshSub: 'Your guest books are deleted.',

  termsBefore: 'I am 18 or older, and I agree to the ',
  terms: 'Terms of Use',
  termsAnd: ' and the ',
  privacy: 'Privacy Policy',

  pin: '6-digit recovery PIN',
  pinHint: "You'll use this if you forget your password. Avoid easy ones like 123456.",
  confirmPin: 'Confirm PIN',
  pinShow: 'Show',
  pinHide: 'Hide',
  securityQuestion: 'Security question',
  chooseQuestion: 'Choose a question',
  loadingQuestions: 'Loading questions...',
  answer: 'Your answer',
  answerHint: "Capital letters and extra spaces don't matter.",
}

const es: typeof en = {
  back: 'Atrás',

  welcomeBack: 'Bienvenido de nuevo',
  signInSub: 'Inicia sesión para volver a los libros que guardaste.',
  password: 'Contraseña',
  forgot: '¿Olvidaste tu contraseña?',
  signIn: 'Iniciar sesión',
  newHere: '¿Eres nuevo aquí?',
  createAnAccount: 'Crear una cuenta',

  createTitle: 'Crear una cuenta',
  createSub: 'Tus libros se guardan en tu cuenta, en cualquier dispositivo.',
  aboutYou: 'Sobre ti',
  firstName: 'Nombre',
  lastName: 'Apellido',
  usernameOptional: 'Nombre de usuario (opcional)',
  usernameHint:
    'De 3 a 20 letras, números o guiones bajos. Si lo dejas en blanco, te crearemos uno.',
  signInDetails: 'Datos para iniciar sesión',
  email: 'Correo electrónico',
  confirmEmail: 'Confirma tu correo electrónico',
  confirmPassword: 'Confirma tu contraseña',
  ageRange: 'Edad',
  chooseAge: 'Elige tu rango de edad',
  recoveryTitle: 'Recuperación de la cuenta',
  recoveryText:
    'Si olvidas tu contraseña, usarás tu PIN, o tu pregunta de seguridad si también olvidas el PIN. No se los des a nadie.',
  createAccount: 'Crear cuenta',
  haveAccount: '¿Ya tienes una cuenta?',

  enterEmail: 'Escribe tu correo electrónico.',
  emailsDiffer: 'Los dos correos electrónicos no coinciden.',
  passwordsDiffer: 'Las dos contraseñas no coinciden.',
  chooseAgeError: 'Elige tu rango de edad.',
  agreeError:
    'Confirma que tienes 18 años o más y que aceptas los Términos de uso y la Política de privacidad.',

  showPassword: 'Mostrar contraseña',
  hidePassword: 'Ocultar contraseña',

  guestBooks: 'Tus libros de invitado',
  keepBooks: (n: number) => (n === 1 ? 'Conservar mi libro' : `Conservar mis ${n} libros`),
  keepBooksSub: 'Pasan a esta cuenta de inmediato.',
  startFresh: 'Empezar de nuevo',
  startFreshSub: 'Tus libros de invitado se eliminan.',

  termsBefore: 'Tengo 18 años o más y acepto los ',
  terms: 'Términos de uso',
  termsAnd: ' y la ',
  privacy: 'Política de privacidad',

  pin: 'PIN de recuperación de 6 dígitos',
  pinHint: 'Lo usarás si olvidas tu contraseña. Evita uno fácil como 123456.',
  confirmPin: 'Confirma el PIN',
  pinShow: 'Mostrar',
  pinHide: 'Ocultar',
  securityQuestion: 'Pregunta de seguridad',
  chooseQuestion: 'Elige una pregunta',
  loadingQuestions: 'Cargando preguntas...',
  answer: 'Tu respuesta',
  answerHint: 'Las mayúsculas y los espacios de más no importan.',
}

export const AUTH = { en, es }