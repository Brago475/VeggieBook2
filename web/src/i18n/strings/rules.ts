// Messages from the account rules (utils/signUpRules.ts, passwordRule.ts,
// recoveryRules.ts). The rules are plain functions, not components, so
// they take the language and read these directly. Spanish uses tú.

type NameField = 'first name' | 'last name'

const en = {
  nameEmpty: (field: NameField) => `Please enter your ${field}.`,
  nameTooLong: (field: NameField) => `Your ${field} must be at most 50 characters.`,
  nameChars: (field: NameField) =>
    `Your ${field} can only use letters, spaces, hyphens, and apostrophes.`,
  usernameLength: 'Your username must be 3 to 20 characters.',
  usernameChars: 'Your username can only use letters, numbers, and underscores.',
  ages: ['18 to 24', '25 to 34', '35 to 44', '45 to 54', '55 to 64', '65 and older'],

  passwordHint:
    'At least 8 characters, with an uppercase letter, a lowercase letter, and a special character like ! or #.',
  passwordRule:
    'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a special character.',
  passwordTooLong: 'Password must be at most 128 characters.',

  pinDigits: 'Your PIN must be exactly 6 digits.',
  pinEasy: 'That PIN is too easy to guess. Please pick another one.',
  pinsDiffer: 'The two PINs do not match.',
  chooseQuestion: 'Please choose a security question.',
  answerEmpty: 'Please answer your security question.',
  answerTooLong: (max: number) => `Your answer must be at most ${max} characters.`,
  questionsError: 'Could not load the questions.',
}

const fieldEs: Record<NameField, { lower: string; upper: string }> = {
  'first name': { lower: 'tu nombre', upper: 'Tu nombre' },
  'last name': { lower: 'tu apellido', upper: 'Tu apellido' },
}

const es: typeof en = {
  nameEmpty: (field: NameField) => `Escribe ${fieldEs[field].lower}.`,
  nameTooLong: (field: NameField) =>
    `${fieldEs[field].upper} puede tener 50 caracteres como máximo.`,
  nameChars: (field: NameField) =>
    `${fieldEs[field].upper} solo puede tener letras, espacios, guiones y apóstrofos.`,
  usernameLength: 'Tu nombre de usuario debe tener de 3 a 20 caracteres.',
  usernameChars: 'Tu nombre de usuario solo puede tener letras, números y guiones bajos.',
  ages: ['18 a 24', '25 a 34', '35 a 44', '45 a 54', '55 a 64', '65 o más'],

  passwordHint:
    'Al menos 8 caracteres, con una letra mayúscula, una minúscula y un carácter especial como ! o #.',
  passwordRule:
    'La contraseña debe tener al menos 8 caracteres e incluir una letra mayúscula, una minúscula y un carácter especial.',
  passwordTooLong: 'La contraseña puede tener 128 caracteres como máximo.',

  pinDigits: 'Tu PIN debe tener exactamente 6 dígitos.',
  pinEasy: 'Ese PIN es demasiado fácil de adivinar. Elige otro.',
  pinsDiffer: 'Los dos PIN no coinciden.',
  chooseQuestion: 'Elige una pregunta de seguridad.',
  answerEmpty: 'Responde tu pregunta de seguridad.',
  answerTooLong: (max: number) => `Tu respuesta puede tener ${max} caracteres como máximo.`,
  questionsError: 'No se pudieron cargar las preguntas.',
}

export const RULES = { en, es }