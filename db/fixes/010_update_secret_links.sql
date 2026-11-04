-- Secret links update from the professor's link review (2026-11-04).
-- Each change matches on both id and old url; the script stops if any row does not match.
-- Labels are updated only where a new label is given.

BEGIN;

CREATE TEMP TABLE link_changes (
    link_id      bigint PRIMARY KEY,
    old_url      text NOT NULL,
    new_url      text NOT NULL,
    new_label_en text,
    new_label_es text
) ON COMMIT DROP;

INSERT INTO link_changes (link_id, old_url, new_url, new_label_en, new_label_es) VALUES
    (1, 'http://www.eatingwell.com/article/280967/7-small-changes-with-big-results/',
         'https://extension.okstate.edu/fact-sheets/making-mealtime-pleasant.html',
         'Tips for making family meals pleasant and relaxed.',
         'Consejos para que las comidas en familia sean agradables y relajadas.'),
    (2, 'http://www.sugarydrinkfacts.org/',
         'https://www.cdc.gov/healthy-weight-growth/rethink-your-drink/index.html',
         NULL, NULL),
    (3, 'http://kidshealth.org/parent/nutrition_center/healthy_eating/portions.html',
         'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Portions-and-Serving-Sizes.aspx',
         NULL, NULL),
    (4, 'http://www.wikihow.com/Read-Nutrition-Facts-on-Food-Labels',
         'https://communityhealth.mayoclinic.org/featured-stories/breakfast-cereal',
         NULL, NULL),
    (5, 'http://bit.ly/19zWIfQ',
         'https://www.fda.gov/consumers/consumer-updates/healthy-breakfasts-kids-its-all-about-balance',
         NULL, NULL),
    (6, 'http://bit.ly/VUSNmq',
         'https://www.foodnetwork.com/healthyeats/recipes/2019/08/easy-breakfast-recipes-for-kids',
         NULL, NULL),
    (7, 'http://www.choosemyplate.gov/',
         'https://nutritionsource.hsph.harvard.edu/healthy-eating-plate',
         NULL, NULL),
    (11, 'http://kidshealth.org/parent/nutrition_center/healthy_eating/kids_cook.html',
         'https://www.connecticutchildrens.org/growing-healthy/8-tips-get-kids-involved-kitchen-age',
         NULL, NULL),
    (13, 'https://www.youtube.com/watch?v=yDuHtJCj_Og',
         'https://www.healthychildren.org/English/family-life/family-dynamics/Pages/family-meals-eat-together-thrive-together.aspx',
         NULL, NULL),
    (14, 'http://www.eatingwell.com/article/280967/7-small-changes-with-big-results/',
         'https://healthychildren.org/english/family-life/media/pages/how-to-make-a-family-media-use-plan.aspx',
         'How to make a family media plan, including screen-free mealtimes.',
         'Cómo crear un plan familiar de uso de medios, incluidas las comidas sin pantallas.'),
    (18, 'http://bit.ly/IrbZlH',
         'https://healthychildren.org/English/healthy-living/nutrition/Pages/Energy-In-Recommended-Food-Drink-Amounts-for-Children.aspx',
         NULL, NULL),
    (19, 'http://www.sugarydrinkfacts.org/',
         'https://nutritionsource.hsph.harvard.edu/healthy-drinks/sugary-drinks/how-sweet-is-it/',
         NULL, NULL),
    (21, 'http://www.heart.org/HEARTORG/GettingHealthy/NutritionCenter/HeartSmartShopping/Reading-Food-Nutrition-Labels_UCM_300132_Article.jsp',
         'https://health.choc.org/how-to-read-a-nutrition-facts-label/',
         NULL, NULL),
    (23, 'https://www.choosemyplate.gov/10-tips-make-half-your-grains-whole-grains-0',
         'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/whole-grains/art-20047826',
         NULL, NULL),
    (24, 'http://www.health.com/health/gallery/0,,20599288_9,00.html',
         'https://healthy.kaiserpermanente.org/health-wellness/health-encyclopedia/he.ta3542',
         NULL, NULL),
    (25, 'http://www.health.com/health/gallery/0,,20599288_9,00.html',
         'https://healthy.kaiserpermanente.org/health-wellness/health-encyclopedia/he.ta3542',
         NULL, NULL),
    (26, 'http://www.health.com/health/gallery/0,,20599288_9,00.html',
         'https://www.columbiadoctors.org/health-library/article/health-claims-food-labels/',
         NULL, NULL),
    (41, 'http://www.eatingwell.com/food_news_origins/food_news/10_food_rules_you_should_follow',
         'https://www.childrensmn.org/educationmaterials/teens/article/7595/smart-supermarket-shopping/',
         'Tips for smart supermarket shopping.',
         'Consejos para hacer compras inteligentes en el supermercado.'),
    (50, 'https://www.choosemyplate.gov/10-tips-make-half-your-grains-whole-grains-0',
         'https://nutritionsource.hsph.harvard.edu/what-should-you-eat/whole-grains/',
         NULL, NULL),
    (53, 'https://www.foodnetwork.com/healthy/packages/healthy-every-week/healthy-tips/a-nutritionists-healthy-buffet-strategies',
         'https://www.upstate.edu/informed/2024/102424-dorsey-expert-buffet.php',
         NULL, NULL);

DO $$
DECLARE
    matched int;
    expected int;
BEGIN
    SELECT count(*) INTO expected FROM link_changes;
    SELECT count(*) INTO matched
    FROM secret_link s
    JOIN link_changes c ON s.id = c.link_id AND s.url = c.old_url;

    IF matched <> expected THEN
        RAISE EXCEPTION 'Expected % matching links, found %. No changes made (already applied or ids differ).', expected, matched;
    END IF;
END $$;

UPDATE secret_link s
SET url      = c.new_url,
    label_en = COALESCE(c.new_label_en, s.label_en),
    label_es = COALESCE(c.new_label_es, s.label_es)
FROM link_changes c
WHERE s.id = c.link_id AND s.url = c.old_url;

-- Second link for Dinner Secret 13 (screens at meals).
INSERT INTO secret_link (secret_id, language, url, label_en, label_es)
SELECT secret_id, language,
       'https://www.mpg.de/14002616/six-components-of-healthy-family-meals',
       'Why turning off the TV at family meals helps kids eat better.',
       'Por qué apagar la televisión durante las comidas en familia ayuda a los niños a comer mejor.'
FROM secret_link
WHERE id = 14
  AND NOT EXISTS (
      SELECT 1 FROM secret_link
      WHERE url = 'https://www.mpg.de/14002616/six-components-of-healthy-family-meals'
  );

COMMIT;