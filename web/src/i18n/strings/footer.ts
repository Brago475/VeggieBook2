// The footer card on the main screens. Spanish uses tú.

const en = {
  title: 'About VeggieBook',
  subBefore: 'Built from ',
  subStrong: 'years of',
  subAfter: ' nutrition research and community work.',
  credit:
    'Originally created by Dr. Peter Clarke and Dr. Susan H. Evans at the USC Annenberg School for Communication and Journalism, with support from the U.S. Department of Agriculture. Continued and rebuilt at Kean University.',
  learnMore: 'Learn about the project',
  legal: 'Legal',
  terms: 'Terms of Use',
  privacy: 'Privacy Policy',
}

const es: typeof en = {
  title: 'Acerca de VeggieBook',
  subBefore: 'Creado a partir de ',
  subStrong: 'años de',
  subAfter: ' investigación en nutrición y trabajo comunitario.',
  credit:
    'Creado originalmente por el Dr. Peter Clarke y la Dra. Susan H. Evans en la Escuela de Comunicación y Periodismo Annenberg de USC, con el apoyo del Departamento de Agricultura de los Estados Unidos. Continuado y reconstruido en Kean University.',
  learnMore: 'Conoce el proyecto',
  legal: 'Información legal',
  terms: 'Términos de uso',
  privacy: 'Política de privacidad',
}

export const FOOTER = { en, es }