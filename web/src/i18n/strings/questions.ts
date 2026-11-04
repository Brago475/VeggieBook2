import type { Lang } from '../language'

// Spanish for the security questions in api/Auth/RecoveryQuestions.cs, by id.
// Retired questions stay here for accounts that still use them.
// A question with no Spanish line shows the server's English text.

const ES: Record<number, string> = {
  1: '¿Cuál es tu verdura favorita?',
  2: '¿Qué comida no te gustaba de niño?',
  3: '¿Cuál es tu plato favorito para cocinar?',
  4: '¿Cuál fue la primera receta que aprendiste a hacer?',
  5: '¿Qué fruta nunca comerías?',
  6: '¿Cuál es tu bocadillo favorito?',
  7: '¿Cómo se llamaba tu primera mascota?',
  8: '¿En qué ciudad naciste?',
  9: '¿Cómo se llamaba tu escuela primaria?',
  10: '¿Cuál era el nombre de tu mejor amigo o amiga de la infancia?',
}

export function questionText(lang: Lang, id: number, serverText: string): string {
  return lang === 'es' ? (ES[id] ?? serverText) : serverText
}