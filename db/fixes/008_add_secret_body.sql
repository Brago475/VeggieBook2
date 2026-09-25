-- Adds the secret body text that the original import left out.
--
-- The original VeggieBook stored three texts per secret: a title, the
-- secret itself, and why it works. The import kept the title
-- (headline_*) and why it works (why_it_works_*), but put the ID of the
-- secret text into display_number instead of the text. This file adds
-- body_en and body_es and fills them from the original data
-- (veggiebook-backend/database/Dump20201109.sql, table qhmobile_string).
--
-- Safe to check before running: every UPDATE only matches a row whose
-- display_number still equals the original text ID, so a row that does
-- not match the original is left alone. Nothing is deleted, and no
-- existing column is changed. The whole file runs in one transaction.
--
-- Expected result: 79 rows updated, 0 rows with an empty body_en.

BEGIN;

ALTER TABLE secret ADD COLUMN IF NOT EXISTS body_en text;
ALTER TABLE secret ADD COLUMN IF NOT EXISTS body_es text;

-- Be a breakfast eater.
UPDATE secret SET
  body_en = $body$Skipping breakfast leads to an empty feeling and a temptation to stuff yourself with unhealthy foods later in the day. And, try to eat breakfast at the table.  You and your family will fill up better if you eat at the table, not while standing up or on-the-go. $body$,
  body_es = $body$El no comer desayuno lo conduce a experimentar un sentimiento de vació, así como la tentación de comer y llenarnse de alimentos nada saludables durante el transcurso del día. Así mismo, trate de comer el desayuno sentado a la mesa. Usted y su familia se llenarán de mejor manera si ustedes comen en la mesa y no mientras están de pie, o caminando de un lado a otro.$body$
WHERE id = 2 AND display_number = 5603;

-- Be a smart server.
UPDATE secret SET
  body_en = $body$Use smaller bowls to limit sugary breakfast cereal.  Your eyes will trick you: You and your family will actually eat less if your plates and bowls are smaller. And, you’ll still feel satisfied.$body$,
  body_es = $body$Use tazones más chicos para limitar las cantidades de cereales de desayuno que contienen mucha azúcar. Sus ojos lo engañarán: Usted y su familia actualmente comerán menos si sus platos y tazones son chicos, además, ustedes aún así se sentirán satisfechos. $body$
WHERE id = 4 AND display_number = 5609;

-- Be a breakfast planner.
UPDATE secret SET
  body_en = $body$Talk about weekly breakfast items with your family, write up a list, and have everyone sign it.  

$body$,
  body_es = $body$Hable con su familia acerca de las opciones semanales del desayuno, escriba una lista, y haga que todos la firmen.

$body$
WHERE id = 6 AND display_number = 5616;

-- After breakfast, put sugary cereals far away.
UPDATE secret SET
  body_en = $body$Keep them in a hard-to-reach cabinet.  Out of sight really is out of mind when you feel the urge to snack.$body$,
  body_es = $body$Mantenga las cajas de cereal en una alacena no muy accesible. "Ojos que no ven, corazón que no siente" los ayudará cuando le de la ansiedad de comer algo en ayunas.$body$
WHERE id = 7 AND display_number = 5619;

-- Set the breakfast table the night before.
UPDATE secret SET
  body_en = $body$Prepare as much of your healthy food the night before, if possible.

If you can, use placemats or a tablecloth. Paper or cloth are both great.  Put something pretty in the middle of the table, such as a plant, flower or other decoration.  
$body$,
  body_es = $body$Si es posible, prepare tanto como pueda de sus alimentos saludables, la noche anterior. 

Si usted puede, use mantelillos o un mantel. De papel o tela, ambas opciones son excelentes. Ponga algo agradable en el centro de la mesa, como una planta, flor o cualquier otra decoración.
$body$
WHERE id = 8 AND display_number = 5622;

-- Place boxes of cereal or other food containers away from the table and out of reach.
UPDATE secret SET
  body_en = $body$Your family is less likely to overeat if the containers are away from the table.$body$,
  body_es = $body$Es menos probable que su familia coma en exceso si los recipientes se encuentran alejados de la mesa.   $body$
WHERE id = 9 AND display_number = 5625;

-- Measure food into one-serving portion sizes.
UPDATE secret SET
  body_en = $body$You might be surprised at what one serving actually is!  Look at the label on the package.  Try measuring out cereal into one-serving portions and put each one into a baggie.  Then you and your family will know how much you are really eating.$body$,
  body_es = $body$¡Usted podría sorprenderse del tamaño actual de lo que es una porción!   Lea la etiqueta del paquete para saber cuanto es una porción. Trate de medir el cereal en cantidades de una-porción y póngalas en bolsitas de plástico. Así usted y su familia sabrán en realidad cuanto están comiendo.$body$
WHERE id = 10 AND display_number = 5628;

-- Choose breakfast cereals carefully.
UPDATE secret SET
  body_en = $body$Many cereals are really cookies in disguise! You can really tell what’s healthy by looking at the ingredients label.  Three things to look for under “serving”: (1) 150 calories or less, (2) less than 8 grams of sugar, (3) at least 3 grams of fiber. $body$,
  body_es = $body$¡Muchos cereales son realmente galletas disfrazadas! Usted puede darse cuenta de lo que es saludable solo con ver los ingredientes en la etiqueta. Tres cosas a las que hay que poner atención bajo la designación de "porción" ("serving") son: (1) 150 calorías o menos, (2) menos de 8 gramos de azúcar, (3) por lo menos 3 gramos de fibra. $body$
WHERE id = 11 AND display_number = 5631;

-- A little fat at breakfast is good.
UPDATE secret SET
  body_en = $body$Peanut butter is healthy for kids and they love it. Try spreading it on toast, on top of oatmeal, or blended with banana in a smoothie.$body$,
  body_es = $body$La mantequilla de cacahuate es saludable para los niños y a ellos les gusta. Déselas untándola en un pan tostado, poniéndosela a la avena, o mezclada con un plátano en un licuado.$body$
WHERE id = 12 AND display_number = 5634;

-- Introduce new foods.
UPDATE secret SET
  body_en = $body$Do it on a weekend when everyone’s relaxed and you can try the foods with your kids.$body$,
  body_es = $body$Hágalo durante un fin de semana cuando todos están más relajados y usted puede experimentar con esos alimentos junto con sus hijos.$body$
WHERE id = 13 AND display_number = 5637;

-- Eat the same breakfast as your kids.
UPDATE secret SET
  body_en = $body$They’re more likely to eat healthy breakfast foods if you eat them too.  So, prepare one meal and everyone will eat healthy.$body$,
  body_es = $body$Sus niños estarán más propensos a comer desayunos saludables si usted los come también. Prepare solo un tipo desayuno para que así todos coman saludablemente.$body$
WHERE id = 14 AND display_number = 5640;

-- Feel more full with whole grains.
UPDATE secret SET
  body_en = $body$If you serve 100% whole grain cereal or toast, your family will feel more full.  This means less snacking later.

Look on package labels for “100% whole grains” or “100% whole wheat.”
$body$,
  body_es = $body$Si usted sirve cereales o pan tostado de 100% de granos enteros, su familia se sentirá más llena. Esto significará que comerán menos bocadillos entre comidas más tarde.

Busque en las etiquetas de los paquetes que digan “100% granos enteros (whole grains)” o “100% trigo entero (whole wheat).”$body$
WHERE id = 15 AND display_number = 5643;

-- Prepare weekend breakfasts with your kids.
UPDATE secret SET
  body_en = $body$If your kids help make the meal, they’re more likely to eat it.  Weekends are a good time to invite kids to develop cooking skills and food interests. 

Being able to cook is a great life skill.  And who knows? Your child could grow up to be the next “Top Chef” or featured on the Food Network. 
$body$,
  body_es = $body$Si sus niños ayudan a preparar la comida, con mayor probabilidad la comerán. Los fines de semana ofrecen una buena oportunidad para invitar a los niños a desarrollar aptitudes para cocinar y fomentar un interés por la comida.  

El saber cocinar es una gran aptitud para toda la vida. ¿Y quien sabe?, su hijo(a) pudiera llegar a ser el próximo "Top Chef" o ser un cocinero(a) destacado(a) en la cadena de televisión "Food Network".
$body$
WHERE id = 17 AND display_number = 5649;

-- Talk about food, where it comes from, and how it tastes.
UPDATE secret SET
  body_en = $body$It will help your family try new flavors.  Weekend breakfasts are a good time to do this.$body$,
  body_es = $body$Esto ayudara a su familia aprobar sabores nuevos. Los desayunos los fines de semana presentan una buena oportunidad de hacer esto.$body$
WHERE id = 18 AND display_number = 5652;

-- Smoothies are a healthy breakfast treat.
UPDATE secret SET
  body_en = $body$VeggieBooks have lots of smoothie recipes.  To get a recipe, just check that you want recipes that use a blender.  $body$,
  body_es = $body$VeggieBook tiene muchas recetas para batidos/licuados. Para obtener estas recetas, solo indique que usted desea recetas que usen una licuadora.$body$
WHERE id = 19 AND display_number = 5655;

-- Set the mood.
UPDATE secret SET
  body_en = $body$At meals, turn off the TV, put mobile phones in another room, and say that videogames and earbuds are off limits.  $body$,
  body_es = $body$Durante las comidas, apague la televisión, ponga los teléfonos móviles en otra habitación, y diga que los juegos de video y audífonos también están prohibidos durante las comidas. $body$
WHERE id = 20 AND display_number = 5658;

-- Making kids clean their plates can lead to overeating.
UPDATE secret SET
  body_en = $body$Let kids respond to their body’s signals that they’re full.  Let them leave some food uneaten if they want.$body$,
  body_es = $body$Deje que los niños respondan a las señales de su cuerpo cuando están llenos. Permítales que dejen algo de lo que les sirvio sin comerselo si así lo desean.$body$
WHERE id = 21 AND display_number = 5661;

-- Be patient in introducing new foods--and keep trying!
UPDATE secret SET
  body_en = $body$Kids usually learn to like new foods. But it will take time and patience.  You may have to offer the new food many times.$body$,
  body_es = $body$Los niños usualmente aprenden a apetecer los alimentos/platillos nuevos. Pero esto tomará tiempo y paciencia. Es probable que usted tenga que ofrecerles los alimentos nuevos varias veces.  $body$
WHERE id = 22 AND display_number = 5664;

-- Eggs can be simple and quick to prepare.
UPDATE secret SET
  body_en = $body$Try cooking vegetables the night before and adding them to your scrambled eggs in the morning.$body$,
  body_es = $body$Intente cocinar unas verduras la noche anterior y añádaselas a sus huevos revueltos en la mañana.$body$
WHERE id = 23 AND display_number = 5667;

-- Leave notes to your kids inside their packed lunches.
UPDATE secret SET
  body_en = $body$Try a message that says: “New item.  Thumbs Up/Down?”  Kids love to give feedback, and asking their opinion actually helps them accept new foods.$body$,
  body_es = $body$Intente escribiendo una notita que diga: "Algo nuevo. ¿Bueno o Malo?" A los niños les encanta dar su opinión, y pidiéndoles su opinión, actualmente los ayuda a aceptar alimentos nuevos.$body$
WHERE id = 24 AND display_number = 5670;

-- Pack lunches for the family the night before.
UPDATE secret SET
  body_en = $body$Measuring smaller portions will help your family not over eat.$body$,
  body_es = $body$Midiendo las porciones ayudaran a su familia a no comer de más.$body$
WHERE id = 26 AND display_number = 5676;

-- Eat colorful, sliced vegetables and fruits.
UPDATE secret SET
  body_en = $body$If the lunchbox is full of colorful food, we are more likely to eat it.  Ask your kids to pick the colors!$body$,
  body_es = $body$Si la "lonchera" esta llena de comida colorida, somos mas propensos a comerla. ¡Pídales a sus niños a que escojan los colores!$body$
WHERE id = 27 AND display_number = 5679;

-- Feel more full with whole grains.
UPDATE secret SET
  body_en = $body$If you pack a sandwich on “100% whole grain" or "100% whole wheat” bread, your family will feel more full—which means less snacking later.$body$,
  body_es = $body$Si usted les prepara un sándwich/emparedado con pan que sea "100% de granos enteros" ("whole grains") o "100% de trigo entero" ("whole wheat"), su familia se sentirá mas llena—lo que significa que comerán menos bocadillos/golosinas entre comidas más tarde.$body$
WHERE id = 28 AND display_number = 5682;

-- Try to vary what you pack for lunch each day.
UPDATE secret SET
  body_en = $body$Your family will be more likely to eat their healthy lunch if they aren’t bored with the same foods.$body$,
  body_es = $body$Su familia será más propensa a comer un almuerzo saludable si no los aburre dándoles lo mismo todo los días. $body$
WHERE id = 29 AND display_number = 5685;

-- Be a selective eater.
UPDATE secret SET
  body_en = $body$Try to limit buffets and all-you-can-eat lunch restaurants.  In these places we all tend to eat more than we need.$body$,
  body_es = $body$Trate de limitar los "buffets" y los restaurantes que ofrecen almuerzos que le permiten servirse y comer todo lo que quiera por un precio. En estos lugares todos tendemos a comer de más$body$
WHERE id = 30 AND display_number = 5688;

-- Sip smartly.
UPDATE secret SET
  body_en = $body$Substitute water, non-fat milk, or smoothies for sugary drinks. $body$,
  body_es = $body$Substituya agua, leche sin grasas, o batidos/licuados ("smoothies") en lugar de bebidas azucaradas.

$body$
WHERE id = 31 AND display_number = 5691;

-- Celebrate your family’s eating successes.
UPDATE secret SET
  body_en = $body$Celebration calls attention to the goals you want to reach.$body$,
  body_es = $body$Celebraciones ponen un énfasis en las metas que queremos alcanzar.$body$
WHERE id = 32 AND display_number = 5695;

-- When at restaurants, beware of combination plates—like meals that come with a side dish and a soda.
UPDATE secret SET
  body_en = $body$Would you have bought all that separately? You can probably save money (and eat more lightly) by selecting only the items you want.$body$,
  body_es = $body$¿Hubiera usted comprado todo eso por separado? Usted probablemente se puede ahorrar dinero (y comer menos) al seleccionar solamente las cosas que usted quiera.$body$
WHERE id = 33 AND display_number = 5697;

-- Be a smart eater in restaurants.
UPDATE secret SET
  body_en = $body$Studies show that most people want restaurants to provide calorie labeling on their menus, though not all places do this.  But, look for these clues, so that you avoid overeating.$body$,
  body_es = $body$Estudios muestran que la mayoría de la gente quieren que restaurantes proveen listas de calorías en sus menus, aunque no todos lugares hacen esto. Pero, busquen estas claves, para evitar sobre comer.$body$
WHERE id = 34 AND display_number = 5700;

-- Be smart about low fat and fat free labels.
UPDATE secret SET
  body_en = $body$“Fat free” or “low fat” doesn’t necessarily mean healthy or few calories.  Low fat or fat free still can have a lot of calories. This advertising label can trick us into overeating. $body$,
  body_es = $body$"Far free" o “Low-fat” ("Bajas en Grasas" o "libre de grasas") no necesariamente significa que sea saludable o que tenga pocas calorías. Low-fat o fat free aún puede contener muchas calorías. Este truco de publicidad nos puede engañar a que comamos de más. $body$
WHERE id = 35 AND display_number = 5703;

-- Surprisingly, food is a poor reward or punishment because it leads to bad eating habits.
UPDATE secret SET
  body_en = $body$Use other treats—such as a game or a play date or more time with sports—as a reward.$body$,
  body_es = $body$Use otras opciones como premios, tales como un juego, o dejarlos ir a jugar con un amigo(a), o poder pasar más tiempo practicado un deporte.
$body$
WHERE id = 36 AND display_number = 5706;

-- Be a storyteller.
UPDATE secret SET
  body_en = $body$Families enjoy eating meals when they’re sharing stories about themselves.$body$,
  body_es = $body$Las familias disfrutan sus comidas cuando comparten historias o anécdotas personales.$body$
WHERE id = 37 AND display_number = 5709;

-- Involve your kids in cooking dinner, even  just with little tasks.
UPDATE secret SET
  body_en = $body$Kids will be more likely to eat healthy food if they help make it.$body$,
  body_es = $body$Los niños comerán alimentos saludables con mayor probabilidad si ayudaron a prepararlos.  $body$
WHERE id = 38 AND display_number = 5712;

-- Take 10 minutes on the weekend to plan weekday dinners with your family.
UPDATE secret SET
  body_en = $body$When you plan together, you’ll be more likely to eat healthy dinners all week.$body$,
  body_es = $body$Cuando planifican juntos, ustedes serán más propensos a comer cenas saludables toda la semana.  $body$
WHERE id = 39 AND display_number = 5715;

-- Let your kids make some decisions about what to have for dinner.
UPDATE secret SET
  body_en = $body$They’ll eat more healthy foods if they take part in choosing them.$body$,
  body_es = $body$Los niños comerán más alimentos saludables si ellos participan en escogerlos.$body$
WHERE id = 40 AND display_number = 5718;

-- Serve dinner on smaller plates, if you have them.
UPDATE secret SET
  body_en = $body$Rule of thumb: We tend to eat less when the food is on smaller plates. $body$,
  body_es = $body$Regla general: Nosotros tendemos a comer menos cuando la comida es servida en platos chicos.$body$
WHERE id = 41 AND display_number = 5721;

-- Serve salads or a soup first at dinner.
UPDATE secret SET
  body_en = $body$By serving a salad or a soup first, you and your family will fill up on healthy food.$body$,
  body_es = $body$Al servirse una ensalada o una sopa primero, usted y su familia se llenarán con alimentos saludables.$body$
WHERE id = 43 AND display_number = 5727;

-- Surprisingly, food is a poor reward or punishment because it leads to bad eating habits.
UPDATE secret SET
  body_en = $body$Use other treats—such as a game or a play date or more time with sports—as a reward.$body$,
  body_es = $body$Utilice otras formas para premiar a sus niños—como el poder jugar más, ir a la casa de un amigo(a), o practicar deportes por más tiempo.$body$
WHERE id = 44 AND display_number = 5730;

-- Make the same dinner for adults and kids.
UPDATE secret SET
  body_en = $body$Your kids are more likely to eat healthy dinners if your entire family eats the same food.   $body$,
  body_es = $body$Sus niños son mas propensos a comer cenas saludables si toda la familia come lo mismo.   $body$
WHERE id = 45 AND display_number = 5733;

-- Gather all the family to eat dinner together at the table.
UPDATE secret SET
  body_en = $body$You’ll all eat more slowly and make better choices if you’re together at the table.  No dinners while standing or on-the-go. No kids eating in their rooms, away from the rest of family.  $body$,
  body_es = $body$Todos ustedes comerán de manera más lenta y tomarán mejores decisiones si están todos juntos en la mesa. No coma de pie o a la carrera. No permita que sus niños coman en sus cuartos, alejados del resto de la familia.  $body$
WHERE id = 46 AND display_number = 5736;

-- Ask friends what healthy dinners work for their families.
UPDATE secret SET
  body_en = $body$All of us are more likely to try a new dish if friends like it.$body$,
  body_es = $body$Todos nosotros somos más propensos a querer probar un platillo nuevo si este les gusto a nuestros amigos.
$body$
WHERE id = 47 AND display_number = 5739;

-- Try to vary how you fix food.
UPDATE secret SET
  body_en = $body$Mix it up! Your family will like a healthy dinner more if they aren’t bored with it.$body$,
  body_es = $body$¡Varíelas! A su familia le gustara más una cena saludable si no se han aburrido de ella.$body$
WHERE id = 48 AND display_number = 5742;

-- Be a dinner planner and create a good mood.
UPDATE secret SET
  body_en = $body$Set dinner places for everyone at a table. Create a calm atmosphere; try paper or cloth placemats or tablecloth. 

If possible, put something pretty in the middle, such as a plant, flower, candle, or other decoration.$body$,
  body_es = $body$Asegúrese que todos tengan un lugar en la mesa. Cree un ambiente de tranquilidad; trate de usar mantelillos de papel o tela o un mantel. 

Si es posible, coloque algo bonito en el centro de la mesa, como una planta, flor, vela u otro adorno. $body$
WHERE id = 49 AND display_number = 5745;

-- Preserve dinner-time calm by banning electronic devices during the meal.
UPDATE secret SET
  body_en = $body$While eating, turn off the TV, put mobile phones in another room, and say that videogames and ear phones are off limits.$body$,
  body_es = $body$Mientras comen, apague la televisión, ponga los teléfonos móviles en otra habitación, y dígales a sus hijos que los juegos de video y audífonos también están prohibidos. $body$
WHERE id = 50 AND display_number = 5748;

-- Eat smarter without weighing or measuring food.
UPDATE secret SET
  body_en = $body$ You can create a “healthy plate” by dividing your plate into 3 sections—protein (meat or fish), grains, and vegetables.  As the picture shows, meat or fish should cover about one-quarter of the plate, grains about one-quarter, and vegetables one-half. $body$,
  body_es = $body$Usted puede crear un "plato saludable" al dividir su plato en 3 secciones—proteína (carne o pescado), granos, y verduras. Como muestra la imagen, la carne o pescado debe cubrir aproximadamente una cuarta parte del plato, granos alrededor de una cuarta parte, y las verduras una mitad.$body$
WHERE id = 51 AND display_number = 5751;

-- Choose wisely at buffets and all-you-can-eat dinner restaurants.
UPDATE secret SET
  body_en = $body$It’s too easy to eat more than you need.$body$,
  body_es = $body$Es muy fácil comer más de lo que usted necesita.$body$
WHERE id = 52 AND display_number = 5754;

-- When eating out, pay attention to portion size and eat only what you really need.
UPDATE secret SET
  body_en = $body$Oftentimes, restaurant portions are very large.  Consider sharing one serving with a friend rather than buying two. Or take home the leftovers for another meal.$body$,
  body_es = $body$Con frecuencia, las porciones que sirven en los restaurantes son muy grandes. Considere compartir un platillo con una amiga(o) en lugar de comprar dos. O llévese a casa lo que haya sobrado para comerlo otro día.$body$
WHERE id = 53 AND display_number = 5757;

-- Talk about your food at dinner.
UPDATE secret SET
  body_en = $body$It will spark your family’s interest in eating new foods.$body$,
  body_es = $body$Esto despertará el interés de su familia en comer comidas o platillos nuevos.$body$
WHERE id = 54 AND display_number = 5760;

-- Forget the “clean plate club.”
UPDATE secret SET
  body_en = $body$Forcing people to clean their plates often encourages them to overeat.$body$,
  body_es = $body$Forzando a la gente a que se coman todo dejando el plato limpio, a menudo los incita a comer de más.$body$
WHERE id = 55 AND display_number = 5763;

-- Slow it down.
UPDATE secret SET
  body_en = $body$Our bodies naturally feel full if we give them enough time to register what we’ve eaten.$body$,
  body_es = $body$Nuestros cuerpos se sienten llenos naturalmente si les damos suficiente tiempo para registrar lo que hemos comido. $body$
WHERE id = 56 AND display_number = 5766;

-- When at restaurants, beware of combination plates—like meals that come with a side dish and a soda.
UPDATE secret SET
  body_en = $body$Would you have bought all that separately? You can probably save money (and eat more lightly) by selecting only the items you want.$body$,
  body_es = $body$¿Hubiera usted comprado todo eso por separado? Usted probablemente se puede ahorrar dinero (y comer menos al mismo tiempo) al seleccionar solamente las cosas que usted quiere.$body$
WHERE id = 57 AND display_number = 5769;

-- Celebrate your family’s eating successes.
UPDATE secret SET
  body_en = $body$Celebration calls attention to goals you want to reach.$body$,
  body_es = $body$Celebraciones ponen un énfasis en las metas que queremos alcanzar.$body$
WHERE id = 58 AND display_number = 5772;

-- Teasing or embarrassing someone for being overweight just makes the situation worse.
UPDATE secret SET
  body_en = $body$People treated this way overeat even more.  $body$,
  body_es = $body$Las personas que son tratadas de esta manera tienden a comer de mas, aún más.$body$
WHERE id = 60 AND display_number = 5778;

-- Be a smart eater in restaurants.
UPDATE secret SET
  body_en = $body$Studies show that most people want restaurants to provide calorie labeling on their menus, though not all places do this.  But, look for these clues, so that you avoid overeating.  $body$,
  body_es = $body$Estudios muestran que la mayoría de la gente quieren que restaurantes proveen listas de calorías en sus menus, aunque no todos lugares hacen esto. Pero, busquen estas claves, para evitar sobre comer.  $body$
WHERE id = 61 AND display_number = 5781;

-- Be smart about low fat and fat free labels.
UPDATE secret SET
  body_en = $body$“Fat free” or “low fat” doesn’t necessarily mean healthy or few calories.  Low fat or fat free can still have a lot of calories. This advertising label can trick us into overeating. $body$,
  body_es = $body$"Fat free" (libre de grasas) o “Low-fat” (bajo en grasas) no necesariamente significa saludable o menos calorías. Low fat o fat free aún puede contener muchas calorías. Este truco de publicidad puede engañarnos a que comamos de más.$body$
WHERE id = 62 AND display_number = 5784;

-- Be persistent in introducing new foods.
UPDATE secret SET
  body_en = $body$Sometimes we have to try a food several times before we enjoy it.$body$,
  body_es = $body$A veces tenemos que probar una comida varias veces antes de que la disfrutemos.$body$
WHERE id = 63 AND display_number = 5787;

-- Looking for new snack ideas?
UPDATE secret SET
  body_en = $body$There are lots of ways to eat healthy and feel full.  Select the VeggieBook option for snacks.

You can always add snack ideas by making a new VeggieBook.  $body$,
  body_es = $body$Hay muchas maneras de comer saludablemente y sentirse lleno. Seleccione la opción para bocadillos de VeggieBook.

Usted siempre puede añadir ideas para bocadillos al crear un VeggieBook nuevo. $body$
WHERE id = 64 AND display_number = 5790;

-- Use vegetable or fruit smoothies as a snack.
UPDATE secret SET
  body_en = $body$Pick any veggie in VeggieBook (except potatoes and onions) and ask for recipes that use a blender or food processor. You’ll find one for a smoothie.
$body$,
  body_es = $body$Escoja cualquier verdura en VeggieBook (excepto papas o cebollas) y opte por recetas que usen una licuadora o procesador de alimentos. Usted encontrará una para un batido/licuado.$body$
WHERE id = 65 AND display_number = 5793;

-- Slice fruits and vegetables to make them even more attractive.
UPDATE secret SET
  body_en = $body$Try colorful sliced fruit, or vegetable slices with cheese.  $body$,
  body_es = $body$Haga la prueba con fruta de colores vivos en rebanadas, o con verduras rebanadas con queso.$body$
WHERE id = 66 AND display_number = 5796;

-- Be a smart snacker.
UPDATE secret SET
  body_en = $body$Avoid eating directly from a package of snack food, even nuts or raisins. You’ll eat more than you planned and more than you need to feel full.$body$,
  body_es = $body$Evite comer directamente del paquete o de la bolsa de un bocadillo/golosina, incluyendo nueces o pasas. Usted comerá más de lo que planeaba y más de lo que necesita para sentirse lleno.$body$
WHERE id = 67 AND display_number = 5799;

-- Take a few extra minutes to help your family snack smartly.
UPDATE secret SET
  body_en = $body$Divide packaged snacks like chips, crackers, or trail mix into bags that contain one serving each.$body$,
  body_es = $body$Divida los bocadillos empaquetados como las papitas, galletas saladas o una mezcla de frutas secas y nueces ("trail mix") en bolsitas de plástico con la cantidad de una porción cada una. $body$
WHERE id = 68 AND display_number = 5802;

-- Place healthy snacks where they’re easy to see and grab, like the front of the refrigerator shelves.
UPDATE secret SET
  body_en = $body$Making foods easy to reach will increase their popularity..$body$,
  body_es = $body$Colocando los alimentos al alcance incrementará su popularidad.$body$
WHERE id = 69 AND display_number = 5805;

-- Eat 3 healthy meals a day and just one snack.
UPDATE secret SET
  body_en = $body$Stick to breakfast, lunch, snack, and dinner.  With just one light snack mid-afternoon, your family won’t over eat.$body$,
  body_es = $body$Mantenga un régimen de desayuno, almuerzo, bocadillo, y cena. Con solo un bocadillo ligero en la tarde, su familia no comerá de más. $body$
WHERE id = 70 AND display_number = 5808;

-- Remind your kids to stop eating when they feel full.
UPDATE secret SET
  body_en = $body$They’ll usually feel just as satisfied with a smaller portion.$body$,
  body_es = $body$Ellos por lo general se sentirán igual de satisfechos comiendo una porción más chica.$body$
WHERE id = 71 AND display_number = 5811;

-- Write calorie counts on the front of packages of less-healthy snack foods.
UPDATE secret SET
  body_en = $body$It will make you and your family think twice when choosing a snack.$body$,
  body_es = $body$Esto hará que usted y su familia lo piensen dos veces cuando vayan a escoger un bocadillo.$body$
WHERE id = 72 AND display_number = 5814;

-- Be a choosy beverage drinker.
UPDATE secret SET
  body_en = $body$Substitute water, non-fat milk, or smoothies for sugary drinks. $body$,
  body_es = $body$Substituya agua, leche sin grasas, o batidos/licuados ("smoothies") en lugar de bebidas azucaradas.
$body$
WHERE id = 73 AND display_number = 5817;

-- Surprisingly, food is a poor reward or punishment because it leads to bad eating habits.
UPDATE secret SET
  body_en = $body$Use other treats—such as a game or a play date or more time with sports—as a reward.$body$,
  body_es = $body$Utilice otras formas para premiar a sus niños—como el poder jugar más, ir a la casa de un amigo(a), o practicar deportes por más tiempo.$body$
WHERE id = 74 AND display_number = 5820;

-- Be smart about low fat and fat free labels.
UPDATE secret SET
  body_en = $body$“Fat free” or “low fat” doesn’t necessarily mean healthy or few calories.  Low fat or fat free can still have a lot of calories. This advertising label can trick us into overeating. $body$,
  body_es = $body$“"Fat free" (libre de grasas) o “Low-fat” (bajo en grasas) no necesariamente significa saludable o menos calorías. Low fat o fat free aún puede contener muchas calorías. Este truco de publicidad puede engañarnos a que comamos de más.$body$
WHERE id = 75 AND display_number = 5823;

-- Be persistent in introducing new foods.
UPDATE secret SET
  body_en = $body$Sometimes we have to try a new food several times before we enjoy it.$body$,
  body_es = $body$A veces tenemos que probar una comida varias veces antes de que la disfrutemos.$body$
WHERE id = 76 AND display_number = 5826;

-- Buy generics for the basics.
UPDATE secret SET
  body_en = $body$Brand-name products often aren’t any different from generics or a grocery chain’s label. They’re just more expensive and have more attractive packaging and advertising to make you spend extra money.$body$,
  body_es = $body$Los productos de marcas reconocidas frecuentemente no son diferentes a los productos de marcas genéricas o a los productos que llevan la marca de la tienda. Los productos de "marca" son solamente más caros, vienen en paquetes más atractivos e incluyen campañas de publicidad para hacer que usted gaste más dinero.$body$
WHERE id = 78 AND display_number = 5832;

-- Be a smart shopper.
UPDATE secret SET
  body_en = $body$Beware of items you see at the ends of aisles or at the check-out line. Stores put items here because they make the highest profit for the store. But these items often have too much fat, sugar, or salt. Profits for the store, but not good for you!$body$,
  body_es = $body$Tenga cuidado con los productos y artículos que se encuentran al final de los pasillos y alrededor de las cajas registradoras. Las tiendas ponen esos productos ahí por que son los que le aportan a la tienda las ganancias más altas. Pero con frecuencia estos productos contienen demasiadas grasas, azúcar o sal. ¡Ganancias para la tienda sí, pero dañinos para usted y su familia!$body$
WHERE id = 79 AND display_number = 5835;

-- Be a careful shopper.
UPDATE secret SET
  body_en = $body$Watch out for promotions like “10 for $10.”  You don’t have to buy all 10! The price is the same whether you buy 2 items or 10. You will pay $1 per item, whatever quantity you need.$body$,
  body_es = $body$Tenga cuidado con las promociones como "10 por $10". ¡Usted no tiene por que comprar los 10 artículos! El precio es el mismo sin importar si usted compra 2 artículos o 10. Usted pagará $1 por artículo, sin importar la cantidad que necesite.$body$
WHERE id = 80 AND display_number = 5838;

-- Stick to your shopping list.
UPDATE secret SET
  body_en = $body$You’ll save money and avoid unhealthy foods you don’t really need.$body$,
  body_es = $body$Usted ahorrará dinero y evitará alimentos no saludables que realmente no necesita. $body$
WHERE id = 81 AND display_number = 5841;

-- Be an alert shopper.
UPDATE secret SET
  body_en = $body$Look for deals on the shelves above or below eye-level.  You’ll save money by looking for brands in less visible locations.$body$,
  body_es = $body$Busque ofertas y especiales en las repisas por encima y por debajo del nivel de sus ojos. Usted ahorrará dinero al buscar y considerar marcas que se encuentran en lugares menos visibles. $body$
WHERE id = 82 AND display_number = 5844;

-- Question the product claims on the front of packages.
UPDATE secret SET
  body_en = $body$“Fat free” or “low fat” doesn’t necessarily mean healthy or few calories.  Low fat or fat free can still have a lot of calories. This advertising label can trick us into overeating. $body$,
  body_es = $body$"Far free" o “Low-fat” ("Bajas en Grasas" o "libre de grasas") no necesariamente significa que sea saludable o de pocas calorías. Low-fat o fat free aún puede contener muchas calorías. Este truco de publicidad nos puede engañar a que comamos de más.$body$
WHERE id = 84 AND display_number = 5850;

-- Be a thoughtful shopper.
UPDATE secret SET
  body_en = $body$Think twice before buying items on sale or marked “good while supplies last.”  That’s the advertising talking.  Ask yourself if you really need it.$body$,
  body_es = $body$Piense dos veces antes de comprar artículos "en oferta" o que han sido marcados como "mientras duren las existencias". Estas frases son pura publicidad. Pregúntese si realmente los necesita. $body$
WHERE id = 85 AND display_number = 5853;

-- Be a smart food planner when you shop.
UPDATE secret SET
  body_en = $body$A famous food writer shares his great “Food Rules.”  Your family can learn some important facts about healthy eating.$body$,
  body_es = $body$Un escritor de comida famoso comparte sus grandes "Reglas de Alimentos". Su familia podría aprender algunos hechos importantes acerca de la alimentación saludable.  $body$
WHERE id = 92 AND display_number = 6127;

-- Many drinks are loaded with sugar.
UPDATE secret SET
  body_en = $body$Lots of drinks have much more sugar than you would expect.  These drinks are not the healthiest for your family.  Try to avoid them when shopping.$body$,
  body_es = $body$Muchas bebidas contienen mucho más azúcar de lo que usted se imagina. Estas bebidas no son las más saludables para su familia. Trate de evitarlas cuando vaya de compras.$body$
WHERE id = 93 AND display_number = 6132;

-- Dietary guidelines and other food facts can help you shop smarter.
UPDATE secret SET
  body_en = $body$There are lots of interesting and important facts that you and your family can learn about food.  These will help guide your family to the healthiest meals.   $body$,
  body_es = $body$Hay muchos datos interesantes e importantes que usted y su familia pueden aprender acerca de los alimentos. Estos datos ayudarán a guiar a su familia hacia las comidas más saludables.   $body$
WHERE id = 94 AND display_number = 6137;

-- Check: should print 79 and 0.
SELECT count(*) FILTER (WHERE body_en IS NOT NULL) AS filled,
       count(*) FILTER (WHERE body_en IS NULL OR body_en = '') AS empty
FROM secret;

COMMIT;