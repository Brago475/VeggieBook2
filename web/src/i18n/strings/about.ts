// The About page and the contact block shared with the legal pages. Paper
// titles, journal names, and license names stay in English, as published.
// Spanish uses tú.

const en = {
  title: 'About VeggieBook',
  intro:
    'VeggieBook helps home cooks make more meals with vegetables. You pick a vegetable you have, answer a few questions, and get your own book of recipes and tips. Secrets Books add simple, no-cost ideas for better breakfasts, lunches, dinners, snacks, and food shopping.',

  originTitle: 'Where it came from',
  origin: [
    'VeggieBook was created by Dr. Peter Clarke and Dr. Susan H. Evans at the Annenberg School for Communication and Journalism, University of Southern California.',
    'It was shaped by years of research with families who use community food pantries. Professional chefs contributed recipes, and families tested the recipes and Secrets before they were added.',
    'In a study with nearly 300 households, cooks who used VeggieBook prepared 38% more vegetable dishes than cooks who did not. VeggieBook is listed in the USDA SNAP-Ed Toolkit.',
  ],

  fundingTitle: 'Funding',
  funding: [
    'The original VeggieBook was supported by the U.S. Department of Agriculture, National Institute of Food and Agriculture, through an Agriculture and Food Initiative grant (2012-68001-15952) for Childhood Obesity Prevention.',
    'Earlier research that led to the app was supported by USDA grant 2006-55215-16730.',
  ],

  appsTitle: 'The original apps',
  apps: [
    'The iPhone app was built by TechEmpower, and the Android app was built by DiPasquo Consulting.',
    "In 2021, the creators made the app's code freely available so other organizations could use and adapt it.",
  ],
  openSource: 'VeggieBook open source code',

  keanTitle: 'Rebuilt at Kean University',
  kean: [
    'In 2026, VeggieBook was rebuilt as a website at Kean University, in the Department of Biological Sciences, under the direction of Dr. Spaccarotella.',
    'The website keeps the original recipes, Secrets, and questions. It adds personal accounts, so your books are saved and can be opened on any device with a web browser. There is nothing to download, and you can still use it as a guest.',
  ],

  researchTitle: 'Research',
  researchIntro: 'Published studies about VeggieBook and the research behind it:',

  newTab: ' (opens in a new tab)',
  licenseBefore: 'The original VeggieBook code is open source under the ',
  licenseMiddle: '. Photos from the original project are used under the ',
  licenseAfter: ' license.',

  contactDept: 'Department of Biological Sciences, Kean University',
}

const es: typeof en = {
  title: 'Acerca de VeggieBook',
  intro:
    'VeggieBook ayuda a quienes cocinan en casa a preparar más comidas con verduras. Eliges una verdura que tienes, respondes unas preguntas y recibes tu propio libro de recetas y consejos. Los Libros de Secretos agregan ideas sencillas y sin costo para mejores desayunos, almuerzos, cenas, bocadillos y compras de comida.',

  originTitle: 'De dónde viene',
  origin: [
    'VeggieBook fue creado por el Dr. Peter Clarke y la Dra. Susan H. Evans en la Escuela de Comunicación y Periodismo Annenberg de la Universidad del Sur de California.',
    'Se desarrolló a partir de años de investigación con familias que usan bancos de alimentos comunitarios. Chefs profesionales aportaron recetas, y las familias probaron las recetas y los Secretos antes de agregarlos.',
    'En un estudio con casi 300 hogares, quienes usaron VeggieBook prepararon un 38% más de platos con verduras que quienes no lo usaron. VeggieBook aparece en el SNAP-Ed Toolkit del USDA.',
  ],

  fundingTitle: 'Financiamiento',
  funding: [
    'El VeggieBook original contó con el apoyo del Departamento de Agricultura de los Estados Unidos, Instituto Nacional de Alimentación y Agricultura, a través de una subvención de la Agriculture and Food Initiative (2012-68001-15952) para la Prevención de la Obesidad Infantil.',
    'La investigación anterior que llevó a la aplicación contó con el apoyo de la subvención del USDA 2006-55215-16730.',
  ],

  appsTitle: 'Las aplicaciones originales',
  apps: [
    'La aplicación para iPhone fue creada por TechEmpower, y la aplicación para Android fue creada por DiPasquo Consulting.',
    'En 2021, los creadores pusieron el código de la aplicación a disposición de todos para que otras organizaciones pudieran usarlo y adaptarlo.',
  ],
  openSource: 'Código abierto de VeggieBook',

  keanTitle: 'Reconstruido en Kean University',
  kean: [
    'En 2026, VeggieBook fue reconstruido como sitio web en Kean University, en el Departamento de Ciencias Biológicas, bajo la dirección de la Dra. Spaccarotella.',
    'El sitio web conserva las recetas, los Secretos y las preguntas originales. Agrega cuentas personales, para que tus libros se guarden y se puedan abrir en cualquier dispositivo con un navegador web. No hay nada que descargar, y todavía puedes usarlo como invitado.',
  ],

  researchTitle: 'Investigación',
  researchIntro: 'Estudios publicados sobre VeggieBook y la investigación que lo respalda (en inglés):',

  newTab: ' (se abre en una pestaña nueva)',
  licenseBefore: 'El código original de VeggieBook es de código abierto bajo la ',
  licenseMiddle: '. Las fotos del proyecto original se usan bajo la licencia ',
  licenseAfter: '.',

  contactDept: 'Departamento de Ciencias Biológicas, Kean University',
}

export const ABOUT = { en, es }