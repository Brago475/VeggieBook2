// Messages from the sign-up rules (utils/signUpRules.ts). The rules are
// plain functions, not components, so they take the language and read
// these directly.

type NameField = 'first name' | 'last name'

const en = {
  nameEmpty: (field: NameField) => `Please enter your ${field}.`,
  nameTooLong: (field: NameField) => `Your ${field} must be at most 50 characters.`,
  nameChars: (field: NameField) =>
    `Your ${field} can only use letters, spaces, hyphens, and apostrophes.`,
  usernameLength: 'Your username must be 3 to 20 characters.',
  usernameChars: 'Your username can only use letters, numbers, and underscores.',
  ages: ['18 to 24', '25 to 34', '35 to 44', '45 to 54', '55 to 64', '65 and older'],
}

const fieldEs: Record<NameField, { lower: string; upper: string }> = {
  'first name': { lower: 'su nombre', upper: 'Su nombre' },
  'last name': { lower: 'su apellido', upper: 'Su apellido' },
}

const es: typeof en = {
  nameEmpty: (field: NameField) => `Escriba ${fieldEs[field].lower}.`,
  nameTooLong: (field: NameField) =>
    `${fieldEs[field].upper} puede tener 50 caracteres como máximo.`,
  nameChars: (field: NameField) =>
    `${fieldEs[field].upper} solo puede tener letras, espacios, guiones y apóstrofos.`,
  usernameLength: 'Su nombre de usuario debe tener de 3 a 20 caracteres.',
  usernameChars: 'Su nombre de usuario solo puede tener letras, números y guiones bajos.',
  ages: ['18 a 24', '25 a 34', '35 a 44', '45 a 54', '55 a 64', '65 o más'],
}

export const RULES = { en, es }