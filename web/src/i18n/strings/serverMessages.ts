// Spanish for messages the API sends, by their code (api/Auth/ErrorCodes.cs).
// English needs nothing here: the API's own text is shown. A code missing
// from this list also shows the API's English, so nothing breaks when a new
// message is added on the server first. Spanish uses tú.

type Values = Record<string, number | string>
type Message = string | ((values: Values) => string)

function nameMessages(field: 'first_name' | 'last_name', word: string, Word: string) {
  return {
    [`${field}_empty`]: `Escribe ${word}.`,
    [`${field}_too_long`]: (v: Values) => `${Word} puede tener ${v.max} caracteres como máximo.`,
    [`${field}_chars`]: `${Word} solo puede tener letras, espacios, guiones y apóstrofos.`,
  }
}

export const SERVER_MESSAGES_ES: Record<string, Message> = {
  // Signing in, signing up, guests
  already_signed_in: 'Ya iniciaste sesión.',
  email_invalid: 'Escribe un correo electrónico válido.',
  terms_required: 'Acepta los Términos de uso y la Política de privacidad.',
  wrong_credentials: 'El correo electrónico o la contraseña no son correctos.',
  email_taken:
    'Ya existe una cuenta con este correo electrónico. Inicia sesión, o usa ¿Olvidaste tu contraseña? si lo necesitas.',
  username_taken_signup:
    'Ese nombre de usuario ya está en uso. Elige otro, o déjalo en blanco y te crearemos uno.',
  username_taken: 'Ese nombre de usuario ya está en uso. Elige otro.',
  too_many_attempts: 'Demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos.',
  guests_off:
    'Las visitas de invitados están desactivadas en este momento. Crea una cuenta o inicia sesión.',

  // Names, username, age
  ...nameMessages('first_name', 'tu nombre', 'Tu nombre'),
  ...nameMessages('last_name', 'tu apellido', 'Tu apellido'),
  username_required: 'Escribe un nombre de usuario.',
  username_length: (v) => `Tu nombre de usuario debe tener de ${v.min} a ${v.max} caracteres.`,
  username_chars: 'Tu nombre de usuario solo puede tener letras, números y guiones bajos.',
  age_range_required: 'Elige tu rango de edad. Debes tener 18 años o más para crear una cuenta.',

  // Passwords
  password_rule: (v) =>
    `La contraseña debe tener al menos ${v.min} caracteres e incluir una letra mayúscula, una minúscula y un carácter especial.`,
  password_too_long: (v) => `La contraseña puede tener ${v.max} caracteres como máximo.`,
  password_incorrect: 'La contraseña no es correcta.',
  current_password_incorrect: 'La contraseña actual no es correcta.',
  too_many_wrong_passwords: 'Demasiadas contraseñas incorrectas. Inténtalo de nuevo en 15 minutos.',
  password_same: 'Tu nueva contraseña no puede ser igual a la anterior.',
  ticket_expired: 'Esto tardó demasiado. Empieza de nuevo.',

  // Recovery PIN and security question
  pin_digits: 'Tu PIN debe tener exactamente 6 dígitos.',
  pin_easy: 'Ese PIN es demasiado fácil de adivinar. Elige otro.',
  pin_wrong: 'Ese PIN no es correcto. Inténtalo de nuevo.',
  pin_mismatch: 'Ese correo electrónico y ese PIN no coinciden.',
  pin_closed_forgot: 'Demasiados PIN incorrectos hoy. Responde tu pregunta de seguridad.',
  pin_closed_change:
    'Demasiados PIN incorrectos hoy. Usa tu contraseña actual o inténtalo de nuevo mañana.',
  question_required: 'Elige una pregunta de seguridad.',
  answer_empty: 'Responde tu pregunta de seguridad.',
  answer_too_long: (v) => `Tu respuesta puede tener ${v.max} caracteres como máximo.`,
  answer_mismatch: 'Esa respuesta no coincide.',
  recovery_locked:
    'El cambio de contraseña está bloqueado para esta cuenta. Comunícate con el administrador de VeggieBook.',
  reset_expired: 'Este cambio de contraseña venció. Empieza de nuevo.',

  // Saving and editing books, and their covers
  book_limit: (v) => `Puedes guardar hasta ${v.max} libros. Elimina uno para hacer espacio.`,
  unknown_vegetable: 'No reconocemos esa verdura.',
  too_many_answers: 'Hay demasiadas respuestas.',
  unknown_answer: 'No reconocemos una de las respuestas.',
  too_many_recipes: 'Hay demasiadas recetas.',
  recipe_twice: 'Una receta aparece dos veces.',
  unknown_recipe: 'No reconocemos una de las recetas.',
  last_recipe: 'Un libro necesita al menos una receta. Mejor elimina el libro.',
  unknown_category: 'No reconocemos ese tipo de secreto.',
  secrets_required: 'Un Libro de Secretos necesita al menos un secreto.',
  too_many_secrets: 'Hay demasiados secretos.',
  secret_twice: 'Un secreto aparece dos veces.',
  unknown_secret: 'No reconocemos uno de los secretos.',
  last_secret: 'Un libro necesita al menos un secreto. Mejor elimina el libro.',
  extra_copies_range: (v) => `Las copias extra deben estar entre ${v.min} y ${v.max}.`,
  choose_one_cover: 'Escoge una portada.',
  unknown_cover: 'No reconocemos esa portada.',
  photo_unusable: 'No se pudo usar esta foto. Prueba con otra foto.',

  // Research tracking and the study notice
  tracking_off_by_admin: 'El equipo de investigación desactivó el seguimiento.',
  notice_answer_invalid: 'Esa respuesta no es válida.',
  no_notice: 'No hay ningún aviso de estudio para responder en este momento.',
}

// Used when a response has no message of its own, and when the API can't
// be reached.
export const FALLBACK_ES = {
  401: 'Vuelve a iniciar sesión.',
  413: 'Esa foto es demasiado grande.',
  429: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
  generic: 'Algo salió mal. Inténtalo de nuevo.',
  offline: 'No se pudo conectar con VeggieBook. Revisa tu conexión e inténtalo de nuevo.',
}

export function translateServerMessage(code: string, values: Values | null): string | null {
  const message = SERVER_MESSAGES_ES[code]
  if (message === undefined) return null
  return typeof message === 'function' ? message(values ?? {}) : message
}