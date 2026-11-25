// SuperTracker2 setup, the saved summary, and the guest screen. Spanish uses tú.

const en = {
  loading: 'Loading SuperTracker2...',
  loadFailed: 'SuperTracker2 could not load.',
  retry: 'Try again',

  guestTitle: 'SuperTracker2 needs an account',
  guestText:
    'Guest sessions are erased after 24 hours, so your progress would be lost. Create a free account from the menu to start tracking.',

  title: 'About you',
  intro:
    'We use these to estimate your calories and daily goals. You can change them anytime.',
  units: 'Units',
  unitsUs: 'US',
  unitsMetric: 'Metric',
  age: 'Age',
  sex: 'Sex',
  female: 'Female',
  male: 'Male',
  height: 'Height',
  feet: 'ft',
  inches: 'in',
  cm: 'cm',
  weight: 'Weight',
  pounds: 'lb',
  kg: 'kg',
  activity: 'How active are you?',
  activities: {
    sedentary: { title: 'Light', text: 'Less than 30 minutes a day of moderate activity' },
    moderate: { title: 'Moderate', text: '30 to 60 minutes a day' },
    active: { title: 'Very active', text: 'More than 60 minutes a day' },
  },
  goal: 'Calorie goal from your doctor (optional)',
  goalHint: 'Leave it empty and SuperTracker2 estimates it for you.',
  goalUnit: 'calories a day',
  save: 'Continue',
  saving: 'Saving...',
  cancel: 'Cancel',

  errAge: 'Enter an age from 18 to 120.',
  errSex: 'Choose one.',
  errHeight: 'Enter a height between 3 ft 4 in and 8 ft 2 in (100 to 250 cm).',
  errWeight: 'Enter a weight between 66 and 771 lb (30 to 350 kg).',
  errActivity: 'Choose how active you are.',
  errGoal: 'Enter a whole number from 1,000 to 5,000, or leave it empty.',

  doneTitle: "You're all set",
  doneText: 'Your daily goals and food tracker are coming next.',
  calorieGoal: 'Calorie goal',
  estimated: 'Estimated for you',
  edit: 'Edit my answers',
}

const es: typeof en = {
  loading: 'Cargando SuperTracker2...',
  loadFailed: 'No se pudo cargar SuperTracker2.',
  retry: 'Intentar de nuevo',

  guestTitle: 'SuperTracker2 necesita una cuenta',
  guestText:
    'Las sesiones de invitado se borran después de 24 horas, así que perderías tu progreso. Crea una cuenta gratis desde el menú para empezar.',

  title: 'Sobre ti',
  intro:
    'Usamos estos datos para estimar tus calorías y metas diarias. Puedes cambiarlos cuando quieras.',
  units: 'Unidades',
  unitsUs: 'EE. UU.',
  unitsMetric: 'Métrico',
  age: 'Edad',
  sex: 'Sexo',
  female: 'Mujer',
  male: 'Hombre',
  height: 'Estatura',
  feet: 'pies',
  inches: 'pulg',
  cm: 'cm',
  weight: 'Peso',
  pounds: 'lb',
  kg: 'kg',
  activity: '¿Qué tan activo eres?',
  activities: {
    sedentary: { title: 'Ligero', text: 'Menos de 30 minutos al día de actividad moderada' },
    moderate: { title: 'Moderado', text: 'De 30 a 60 minutos al día' },
    active: { title: 'Muy activo', text: 'Más de 60 minutos al día' },
  },
  goal: 'Meta de calorías de tu médico (opcional)',
  goalHint: 'Déjala vacía y SuperTracker2 la calcula por ti.',
  goalUnit: 'calorías al día',
  save: 'Continuar',
  saving: 'Guardando...',
  cancel: 'Cancelar',

  errAge: 'Escribe una edad de 18 a 120.',
  errSex: 'Elige una opción.',
  errHeight: 'Escribe una estatura entre 3 pies 4 pulg y 8 pies 2 pulg (100 a 250 cm).',
  errWeight: 'Escribe un peso entre 66 y 771 lb (30 a 350 kg).',
  errActivity: 'Elige qué tan activo eres.',
  errGoal: 'Escribe un número entero de 1,000 a 5,000, o déjalo vacío.',

  doneTitle: 'Todo listo',
  doneText: 'Tus metas diarias y el registro de comidas vienen pronto.',
  calorieGoal: 'Meta de calorías',
  estimated: 'Calculada para ti',
  edit: 'Cambiar mis respuestas',
}

export const ST_SETUP = { en, es }