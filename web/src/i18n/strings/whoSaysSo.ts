// "Who Says So?", word for word from the original pages in the original
// backend (qhweb/qhmobile/static/whosaysso_en.html and whosaysso_es.html).
// Spanish keeps the original words; only missing accents and one missing
// opening quote mark were fixed. The two originals describe Maria
// differently, and each language keeps its own.

const en = {
  title: 'Who Says So?',
  intro: [
    "Hi, I'm Maria. I'm a nurse, a mom, and a grandmother of two.",
    'Each Secret has been Mom-tested. Other families, just like yours, use these Secrets to improve eating and meals with their families. And, studies by University researchers agree that these Secrets really work!',
    "These Secrets are small, simple steps that you can take. And, these Secrets will bring BIG rewards in better eating right away. Secrets don't cost money; in fact, they save you money.",
  ],
  heading:
    "Here's what Moms say about recipes in VeggieBooks and ideas they find in SecretsBooks:",
  quotes: [
    "Recipes are very versatile. We're cooking different and more healthy.",
    "Now, my son helps me with meals. It's fun together.",
    "We're eating dinner as a family and talking about our day.",
    "I've bonded with my daughters. We shop together and prepare our meals around vegetables.",
    'The sugar calculator helped us cut down on soft drinks.',
    'I have used the tips on how to store vegetables so they keep longer.',
    'The whole family is learning how to cook, instead of going out for fast food.',
    'There are lots of good breakfast and snack ideas.',
    "I'm learning new things about food and serving meals, and I'm having fun doing it.",
    'I have shared recipes and secrets with my family and friends. I even did a presentation about the materials at my apartment complex. Now, my church has asked me to talk about the phone app and healthy eating.',
    'Secrets to better shopping are great.',
    "I'm learning how to read package labels and not just buy whatever looks good.",
  ],
}

const es: typeof en = {
  title: '¿Quién lo dice?',
  intro: [
    'Hola, me llamo Maria y soy una enfermera, pero también una mamá con 2 hijos, uno de 10 y otro de 14 años.',
    'Cada Secreto ha sido puesto a prueba por mamás como usted. Otras familias, como la suya, usan estos Secretos para mejorar su alimentación y comidas con sus familias. Así mismo, estudios conducidos por investigadores universitarios concuerdan que ¡estos Secretos realmente funcionan!',
    'Estos Secretos son pasos chicos y sencillos que usted puede tomar. Y, de inmediato estos Secretos le traerán GRANDES beneficios a través de una mejor alimentación. Estos Secretos no cuestan nada, al contrario, ellos le ahorrarán dinero.',
  ],
  heading:
    'Esto es lo que las mamás dicen acerca de las recetas en VeggieBook y de las ideas que encuentran en SecretsBooks:',
  quotes: [
    'Las recetas son muy versátiles. Estamos cocinando diferente y más saludable.',
    'Ahora mi hijo me ayuda con las comidas. Es divertido haciéndolo juntos.',
    'Estamos cenando juntos en familia y hablando acerca de lo transcurrido durante el día.',
    'Mi relación con mis hijas se ha estrechado. Vamos de compras juntas y preparamos nuestras comidas enfocadas alrededor de verduras.',
    'La calculadora de azúcar nos ayudó a reducir el consumo de refrescos.',
    'He usado los consejos de cómo guardar las verduras para que duren más.',
    'Toda la familia está aprendiendo a cocinar, en vez de ir por comida chatarra.',
    'Hay muchas ideas para desayunos y bocadillos ricos.',
    'Estoy aprendiendo cosas nuevas acerca de la comida e ideas para servirlas, y me estoy divirtiendo haciéndolo.',
    'He compartido recetas y secretos con mi familia y amistades. Incluso, hice una presentación acerca de estos materiales en mi complejo de apartamentos. Ahora mi iglesia me ha pedido que hable acerca de la aplicación de teléfono y de una alimentación saludable.',
    'Los Secretos para mejorar las compras son excelentes.',
    'Estoy aprendiendo cómo leer las etiquetas de los paquetes y no solo comprar lo que se vea bueno.',
  ],
}

export const WHO_SAYS_SO = { en, es }