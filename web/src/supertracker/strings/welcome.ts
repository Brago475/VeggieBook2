// SuperTracker2 welcome screen. Spanish uses tú.

const en = {
  logoAlt: 'SuperTracker2 logo',
  title: 'Welcome to SuperTracker2',
  intro:
    'Track your vegetables and everything else you eat, see how close you are to your daily goals, and watch your progress week by week.',
  stepsLabel: 'How it works',
  steps: [
    { title: 'Tell us about you', text: 'Age, sex, height, weight and activity set your plan.' },
    { title: 'Get your daily goals', text: 'Vegetable servings and more, from the 2025-2030 Dietary Guidelines.' },
    { title: 'Add what you eat', text: 'Pick from VeggieBook vegetables or search thousands of foods.' },
    { title: 'See your progress', text: 'Daily totals, weekly reports and badges.' },
  ],
  separate:
    'SuperTracker2 is separate from your VeggieBooks. What you enter here is not part of any research study.',
  viewLabel: 'How do you want to see it?',
  viewApp: 'App view',
  viewAppText: 'A narrow column, like on a phone.',
  viewSite: 'Website view',
  viewSiteText: 'Wider pages that use the whole screen.',
  getStarted: 'Get started',
  guide: 'How SuperTracker2 works',
  comingSoon: 'Coming soon',
}

const es: typeof en = {
  logoAlt: 'Logotipo de SuperTracker2',
  title: 'Bienvenido a SuperTracker2',
  intro:
    'Lleva la cuenta de tus verduras y de todo lo que comes, mira qué tan cerca estás de tus metas diarias y sigue tu progreso semana a semana.',
  stepsLabel: 'Cómo funciona',
  steps: [
    { title: 'Cuéntanos de ti', text: 'Tu edad, sexo, estatura, peso y actividad definen tu plan.' },
    { title: 'Recibe tus metas diarias', text: 'Porciones de verduras y más, según las Guías Alimentarias 2025-2030.' },
    { title: 'Agrega lo que comes', text: 'Elige verduras de VeggieBook o busca entre miles de alimentos.' },
    { title: 'Mira tu progreso', text: 'Totales del día, reportes semanales e insignias.' },
  ],
  separate:
    'SuperTracker2 es aparte de tus VeggieBooks. Lo que anotes aquí no forma parte de ningún estudio de investigación.',
  viewLabel: '¿Cómo quieres verlo?',
  viewApp: 'Vista de app',
  viewAppText: 'Una columna angosta, como en un teléfono.',
  viewSite: 'Vista de sitio web',
  viewSiteText: 'Páginas más anchas que usan toda la pantalla.',
  getStarted: 'Empezar',
  guide: 'Cómo funciona SuperTracker2',
  comingSoon: 'Próximamente',
}

export const ST_WELCOME = { en, es }