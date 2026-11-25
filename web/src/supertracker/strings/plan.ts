// SuperTracker2 "My plan". Spanish uses tú.

const en = {
  title: 'My plan',
  basedOn: 'Based on your profile',
  edit: 'Edit',
  calories: 'calories a day',
  fromDoctor: 'Your calorie goal from your doctor.',
  estimated: 'Estimated need about',
  estimatedEnd: 'calories.',
  activityWord: 'activity',
  eatTitle: 'Eat this much each day',
  servingsWord: 'servings',
  to: 'to',
  groups: {
    vegetables: { name: 'Vegetables', size: '1 serving: 1 cup raw or cooked, or 2 cups leafy greens' },
    fruits: { name: 'Fruits', size: '1 serving: 1 cup raw, or ½ cup dried' },
    dairy: { name: 'Dairy', size: '1 serving: 1 cup milk, ¾ cup yogurt, or 1 oz cheese' },
    wholeGrains: {
      name: 'Whole grains',
      size: '1 serving: ½ cup cooked oats, brown rice or quinoa, 1 slice bread, or 1 tortilla',
    },
    protein: {
      name: 'Protein foods',
      size: '1 serving: about 3 oz cooked meat or fish, 1 egg, ½ cup beans, or 1 oz nuts',
    },
    healthyFats: { name: 'Healthy fats', size: '1 serving: 1 tsp olive oil or butter' },
  },
  proteinGrams: 'grams of protein (1.2 to 1.6 g per kg of body weight)',
  limitsTitle: 'Daily limits',
  sodium: 'Sodium',
  satFat: 'Saturated fat',
  lessThan: 'less than',
  activityGoal:
    'Activity: at least {n} minutes a week of moderate activity. Vigorous minutes count double.',
  source:
    'Daily servings from the Dietary Guidelines for Americans, 2025-2030. Calorie estimate from the USDA SuperTracker formula.',
}

const es: typeof en = {
  title: 'Mi plan',
  basedOn: 'Según tu perfil',
  edit: 'Cambiar',
  calories: 'calorías al día',
  fromDoctor: 'Tu meta de calorías de tu médico.',
  estimated: 'Necesitas unas',
  estimatedEnd: 'calorías.',
  activityWord: 'actividad',
  eatTitle: 'Come esto cada día',
  servingsWord: 'porciones',
  to: 'a',
  groups: {
    vegetables: { name: 'Verduras', size: '1 porción: 1 taza cruda o cocida, o 2 tazas de hojas verdes' },
    fruits: { name: 'Frutas', size: '1 porción: 1 taza cruda, o ½ taza seca' },
    dairy: { name: 'Lácteos', size: '1 porción: 1 taza de leche, ¾ taza de yogur, o 1 oz de queso' },
    wholeGrains: {
      name: 'Granos integrales',
      size: '1 porción: ½ taza de avena, arroz integral o quinoa cocidos, 1 rebanada de pan, o 1 tortilla',
    },
    protein: {
      name: 'Proteínas',
      size: '1 porción: unas 3 oz de carne o pescado cocido, 1 huevo, ½ taza de frijoles, o 1 oz de nueces',
    },
    healthyFats: { name: 'Grasas saludables', size: '1 porción: 1 cdta de aceite de oliva o mantequilla' },
  },
  proteinGrams: 'gramos de proteína (1.2 a 1.6 g por kg de peso)',
  limitsTitle: 'Límites diarios',
  sodium: 'Sodio',
  satFat: 'Grasa saturada',
  lessThan: 'menos de',
  activityGoal:
    'Actividad: al menos {n} minutos a la semana de actividad moderada. Los minutos intensos cuentan doble.',
  source:
    'Porciones diarias de las Guías Alimentarias para los Estadounidenses, 2025-2030. Cálculo de calorías con la fórmula de USDA SuperTracker.',
}

export const ST_PLAN = { en, es }