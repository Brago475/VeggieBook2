-- Suggested meal labels from recipe titles, to be reviewed on the admin
-- Meal labels screen. Safe to run more than once: existing labels are kept.

BEGIN;

INSERT INTO meal_label (kind, item_id, meal)
SELECT 'recipe', s.id, unnest(s.meals)
FROM (VALUES
    -- Broccoli
    (1,   '{lunch}'::text[]),           -- Broccoli and Apple Salad
    (2,   '{dinner}'::text[]),          -- Ginger Broccoli
    (3,   '{snack}'::text[]),           -- Broccoli Crock Pot Corn Bread
    (4,   '{lunch,dinner}'::text[]),    -- Broccoli Tacos
    (5,   '{dinner}'::text[]),          -- Boiled Broccoli
    (7,   '{dinner}'::text[]),          -- Fried Broccoli with Garlic
    (8,   '{dinner}'::text[]),          -- Roasted Italian Broccoli
    (9,   '{lunch}'::text[]),           -- Broccoli and Vegetable Salad (with Noodles)
    (10,  '{dinner}'::text[]),          -- Broccoli and Carrots
    (11,  '{lunch,dinner}'::text[]),    -- Broccoli Stuffed Baked Potatoes
    (12,  '{dinner}'::text[]),          -- Broccoli with Lemon Topping
    (14,  '{dinner}'::text[]),          -- Microwaved Broccoli
    (15,  '{dinner}'::text[]),          -- Steamed Broccoli
    (16,  '{dinner}'::text[]),          -- Stove-Top Chicken and Broccoli
    (17,  '{lunch,dinner}'::text[]),    -- Broccoli and Tomato Soup
    (18,  '{dinner}'::text[]),          -- Broccoli and Rice Casserole
    (19,  '{lunch,dinner}'::text[]),    -- Broccoli, Black Bean, Corn, and Chicken/Meat Mix
    (205, '{lunch,dinner}'::text[]),    -- Broccoli, Corn, Rice, and Chicken/Meat Combo
    (206, '{dinner}'::text[]),          -- Broccoli, Meat, and Noodles Casserole
    (207, '{dinner}'::text[]),          -- Broccoli Stir-Fry with Meat or Chicken
    (209, '{lunch,dinner}'::text[]),    -- Broccoli and Cheese Soup
    (210, '{dinner}'::text[]),          -- Microwave Broccoli and Beef
    (211, '{lunch,dinner}'::text[]),    -- Broccoli Burritos
    (212, '{lunch,snack}'::text[]),     -- Tortilla Pizza with Broccoli
    (257, '{breakfast,snack}'::text[]), -- Broccoli-Blueberry Smoothie

    -- Cabbage
    (40,  '{dinner}'::text[]),          -- Stove-Top Sweet and Sour Cabbage
    (41,  '{dinner}'::text[]),          -- Cabbage and Meat Casserole
    (42,  '{snack}'::text[]),           -- Cabbage Salsa
    (43,  '{dinner}'::text[]),          -- Simmered Cabbage
    (44,  '{dinner}'::text[]),          -- Country Cabbage
    (45,  '{dinner}'::text[]),          -- Baked Cabbage and Vegetable Casserole
    (46,  '{lunch,dinner}'::text[]),    -- Potato Cabbage Soup
    (47,  '{dinner}'::text[]),          -- Cabbage, Apple, and Chicken Casserole
    (48,  '{lunch}'::text[]),           -- Cabbage Salad
    (49,  '{dinner}'::text[]),          -- Boiled Cabbage
    (50,  '{dinner}'::text[]),          -- Microwaved Cabbage
    (51,  '{dinner}'::text[]),          -- Stir-Fry Cabbage
    (52,  '{dinner}'::text[]),          -- Fried Cabbage with Onions
    (53,  '{dinner}'::text[]),          -- Steamed Cabbage
    (54,  '{lunch,dinner}'::text[]),    -- Noodles, Cabbage, and Cheese
    (55,  '{lunch}'::text[]),           -- Coleslaw
    (56,  '{dinner}'::text[]),          -- Cabbage and Apples
    (57,  '{dinner}'::text[]),          -- Stove-Top Cabbage, Onions, and Potatoes
    (58,  '{lunch,dinner}'::text[]),    -- Crock-Pot Cabbage Chili
    (59,  '{lunch,dinner}'::text[]),    -- Cabbage, Noodles and Peanut Sauce
    (60,  '{lunch,dinner}'::text[]),    -- Sloppy Joes
    (213, '{lunch,dinner}'::text[]),    -- Cabbage and Beef Soup
    (214, '{dinner}'::text[]),          -- Microwave Cabbage and Pork Chops
    (215, '{dinner}'::text[]),          -- Stuffed Cabbage
    (255, '{dinner}'::text[]),          -- Cabbage and Potato Casserole
    (259, '{breakfast,snack}'::text[]), -- Cabbage-Strawberry Smoothie

    -- Carrot
    (20,  '{lunch,dinner}'::text[]),    -- Carrot Soup
    (21,  '{dinner}'::text[]),          -- Carrots with Chicken, One-Dish Meal
    (22,  '{dinner}'::text[]),          -- Spicy Lemon Carrots
    (23,  '{dinner}'::text[]),          -- Jalapeño Carrots
    (24,  '{dinner}'::text[]),          -- Crock Pot Carrots
    (25,  '{dinner}'::text[]),          -- Maple Syrup and Brown Sugar Carrots
    (26,  '{lunch}'::text[]),           -- Sweet and Sour Carrot Salad
    (27,  '{dinner}'::text[]),          -- Boiled Carrots
    (29,  '{dinner}'::text[]),          -- Stir-Fry Carrots
    (30,  '{lunch}'::text[]),           -- Carrot and Raisin Salad
    (31,  '{dinner}'::text[]),          -- Baked Carrots and Apples
    (32,  '{dinner}'::text[]),          -- Pan-Fried Carrots
    (33,  '{dinner}'::text[]),          -- Stove-Top, Seasoned Carrots
    (34,  '{lunch,dinner}'::text[]),    -- Vegetable Soup
    (35,  '{dinner}'::text[]),          -- Microwaved Carrots
    (36,  '{dinner}'::text[]),          -- Microwaved Orange-Glazed Carrots
    (37,  '{dinner}'::text[]),          -- Steamed Carrots
    (38,  '{dinner}'::text[]),          -- Baked Carrots
    (39,  '{dinner}'::text[]),          -- One-Pot Chicken and Rice
    (225, '{breakfast,snack}'::text[]), -- Carrot Bread (Part Microwave)
    (227, '{dinner}'::text[]),          -- Carrots and Rice with Meat
    (228, '{dinner}'::text[]),          -- Carrot and Potato Mash
    (236, '{dinner}'::text[]),          -- Beef Stew with Carrots
    (256, '{breakfast,snack}'::text[]), -- Carrot-Pineapple Smoothie
    (268, '{dinner}'::text[]),          -- Crock Pot Chicken and Carrot Stew

    -- Cauliflower
    (61,  '{dinner}'::text[]),          -- Steamed Cauliflower
    (62,  '{dinner}'::text[]),          -- Boiled Cauliflower
    (63,  '{dinner}'::text[]),          -- Microwaved Cauliflower
    (64,  '{dinner}'::text[]),          -- Garlic Cauliflower
    (65,  '{lunch}'::text[]),           -- Cauliflower, Carrot and Celery Salad
    (66,  '{dinner}'::text[]),          -- Southern Cauliflower Casserole
    (67,  '{dinner}'::text[]),          -- Creamy Mashed Cauliflower
    (68,  '{lunch}'::text[]),           -- Cauliflower and Apple Salad
    (69,  '{dinner}'::text[]),          -- Cauliflower and Broccoli Stir-Fry
    (70,  '{snack}'::text[]),           -- Cauliflower with Salsa
    (71,  '{dinner}'::text[]),          -- Crock-Pot Cauliflower Casserole
    (72,  '{dinner}'::text[]),          -- Cauliflower with Mustard-Lemon Sauce
    (73,  '{dinner}'::text[]),          -- Cauliflower, Broccoli and Tomato Sauce
    (74,  '{dinner}'::text[]),          -- Cauliflower and Chicken Casserole
    (75,  '{dinner}'::text[]),          -- Stove-Top Cauliflower and Spinach
    (76,  '{dinner}'::text[]),          -- Sweet Cauliflower
    (77,  '{dinner}'::text[]),          -- Cauliflower with Cheese
    (78,  '{dinner}'::text[]),          -- Roasted Cauliflower
    (79,  '{dinner}'::text[]),          -- Spicy Cauliflower
    (80,  '{lunch}'::text[]),           -- Cauliflower-Potato Patties
    (81,  '{lunch,dinner}'::text[]),    -- Cauliflower and Carrot Soup
    (216, '{lunch,dinner}'::text[]),    -- Cauliflower, Black Bean, Corn, and Chicken/Meat Combo
    (218, '{lunch,dinner}'::text[]),    -- Cauliflower, Corn, Rice, and Chicken/Meat Combo
    (234, '{dinner}'::text[]),          -- Cheesy Cauliflower and Chicken
    (235, '{dinner}'::text[]),          -- Stove-top Chicken and Cauliflower
    (239, '{dinner}'::text[]),          -- Cauliflower and Meat Casserole
    (246, '{dinner}'::text[]),          -- Microwave Chicken and Cauliflower
    (258, '{breakfast,snack}'::text[]), -- Cauliflower-Raspberry Smoothie
    (263, '{lunch,snack}'::text[]),     -- Tortilla Pizza with Cauliflower
    (266, '{lunch,dinner}'::text[]),    -- Roasted Cauliflower and Apple Soup

    -- Green bean
    (82,  '{dinner}'::text[]),          -- Lemon Green Beans
    (83,  '{dinner}'::text[]),          -- Green Beans with Salsa
    (84,  '{lunch}'::text[]),           -- Potato Salad with Green Beans
    (85,  '{dinner}'::text[]),          -- Crock Pot Green Bean and Potato Casserole
    (86,  '{lunch,dinner}'::text[]),    -- Green Bean Soup
    (87,  '{dinner}'::text[]),          -- Boiled Green Beans
    (88,  '{dinner}'::text[]),          -- Steamed Green Beans
    (89,  '{dinner}'::text[]),          -- Microwaved Green Beans
    (90,  '{dinner}'::text[]),          -- Fried Green Beans
    (92,  '{dinner}'::text[]),          -- Roasted Green Beans
    (93,  '{dinner}'::text[]),          -- Stir-Fried Green Beans with Vegetables and Meat
    (94,  '{lunch}'::text[]),           -- Cold Green Bean and Tomato Salad
    (95,  '{dinner}'::text[]),          -- Green Beans and Carrots
    (96,  '{dinner}'::text[]),          -- Baked Green Beans and Vegetables
    (97,  '{dinner}'::text[]),          -- Green Beans with Tomatoes and Onions
    (98,  '{dinner}'::text[]),          -- Sweet and Sour Green Beans
    (99,  '{dinner}'::text[]),          -- Chicken with Green Beans and Vegetables
    (100, '{dinner}'::text[]),          -- Green Beans with Barbeque Sauce
    (101, '{dinner}'::text[]),          -- Mustard Chicken with Green Beans
    (219, '{lunch,dinner}'::text[]),    -- Microwave Green Bean Soup
    (233, '{dinner}'::text[]),          -- Chicken, Stuffing, and Green Bean Casserole
    (240, '{dinner}'::text[]),          -- Beef and Green Beans
    (241, '{dinner}'::text[]),          -- Pan-roasted Chicken with Lemon-Garlic Green Beans
    (244, '{lunch,dinner}'::text[]),    -- Creamy Green Bean Soup
    (260, '{breakfast,snack}'::text[]), -- Green Bean and Fruit Smoothie

    -- Onion
    (102, '{dinner}'::text[]),          -- Greens and Onions
    (103, '{dinner}'::text[]),          -- Microwaved Potatoes and Onions
    (104, '{dinner}'::text[]),          -- Bok Choy and Onions
    (106, '{dinner}'::text[]),          -- Boiled Onions
    (107, '{dinner}'::text[]),          -- Sweet and Sour Onions
    (108, '{lunch,dinner}'::text[]),    -- Noodles with Fried Onions
    (109, '{lunch}'::text[]),           -- Cucumber and Onion Salad
    (110, '{dinner}'::text[]),          -- Honey-Baked Onions for the Microwave
    (111, '{dinner}'::text[]),          -- Honey-Baked Onions
    (112, '{dinner}'::text[]),          -- Vegetable and Onion Stir-Fry
    (113, '{dinner}'::text[]),          -- Onion and Chicken Bake
    (114, '{dinner}'::text[]),          -- Baked Onions and Potatoes
    (116, '{dinner}'::text[]),          -- Fried Onions
    (117, '{dinner}'::text[]),          -- Steamed Onions
    (118, '{dinner}'::text[]),          -- Microwaved Onions
    (119, '{dinner}'::text[]),          -- Crock Pot Onions
    (120, '{dinner}'::text[]),          -- Spicy Onions in Lime Juice
    (121, '{snack}'::text[]),           -- Baked Onion Rings
    (217, '{lunch,dinner}'::text[]),    -- Meat and Onion Pizza
    (220, '{dinner}'::text[]),          -- Microwave Chicken and Onions and Garlic
    (232, '{lunch,dinner}'::text[]),    -- Fajitas
    (237, '{dinner}'::text[]),          -- Beef Stew with Onions
    (242, '{dinner}'::text[]),          -- Baked Onions
    (243, '{lunch,dinner}'::text[]),    -- Chicken and Onion Soup
    (265, '{lunch,snack}'::text[]),     -- Tortilla Pizza with Onions
    (269, '{dinner}'::text[]),          -- Onion Pot Roast in a Crock Pot

    -- Potato
    (122, '{dinner}'::text[]),          -- Crock-Pot Beef and Potato Stew
    (123, '{breakfast}'::text[]),       -- Potato Pancakes
    (124, '{dinner}'::text[]),          -- Boiled Potatoes
    (125, '{dinner}'::text[]),          -- Baked Potatoes
    (126, '{dinner}'::text[]),          -- Microwaved Potatoes
    (128, '{dinner}'::text[]),          -- Smashed Potatoes
    (129, '{dinner}'::text[]),          -- Potatoes Baked with Cheese
    (130, '{lunch}'::text[]),           -- Potato Salad
    (131, '{lunch,dinner}'::text[]),    -- Potato and Corn Chowder
    (133, '{dinner,snack}'::text[]),    -- Crispy Twice-Cooked Potatoes
    (134, '{dinner}'::text[]),          -- Steamed Potatoes
    (135, '{dinner}'::text[]),          -- Oven Roasted Potatoes with Vegetables
    (136, '{dinner}'::text[]),          -- Potatoes with Cooked Spinach or Greens
    (137, '{lunch,dinner}'::text[]),    -- Potatoes and Chili
    (138, '{lunch}'::text[]),           -- Potatoes Topped with Beans and Salsa
    (139, '{dinner}'::text[]),          -- One-Dish Potatoes and Baked Chicken
    (140, '{dinner}'::text[]),          -- Potato, Meat, and Corn Casserole
    (221, '{lunch,dinner}'::text[]),    -- Meat Stuffed Potatoes
    (223, '{lunch,dinner}'::text[]),    -- Potato and Meat Tacos
    (245, '{dinner}'::text[]),          -- Scalloped Potatoes
    (247, '{snack}'::text[]),           -- Crispy Oven French Fries

    -- Root vegetable
    (141, '{dinner}'::text[]),          -- Mashed Potatoes with Turnips
    (142, '{dinner}'::text[]),          -- Boiled Turnips or Rutabagas or Parsnips
    (143, '{dinner}'::text[]),          -- Microwaved Rutabagas or Turnips or Parsnips
    (144, '{dinner}'::text[]),          -- Steamed Rutabagas or Turnips or Parsnips
    (145, '{dinner}'::text[]),          -- Baked Turnips with Ginger
    (146, '{dinner}'::text[]),          -- Maple Glazed Turnips
    (147, '{dinner}'::text[]),          -- Roast Chicken with Parsnips in Mustard Sauce
    (148, '{dinner}'::text[]),          -- Mixed Roasted Vegetables
    (149, '{dinner}'::text[]),          -- Turnips with Green Beans and Peas
    (150, '{dinner}'::text[]),          -- Mashed Rutabagas with Garlic
    (151, '{dinner}'::text[]),          -- Beef with Rutabagas
    (152, '{breakfast}'::text[]),       -- Potato and Turnip Pancakes
    (153, '{dinner}'::text[]),          -- Sweet and Spicy Rutabagas
    (154, '{dinner}'::text[]),          -- Crock Pot Turnip Casserole
    (155, '{dinner}'::text[]),          -- Stove-Top Fried Parsnips
    (156, '{lunch,dinner}'::text[]),    -- Rutabaga and Potato Soup
    (157, '{lunch,dinner}'::text[]),    -- Parsnip Maple Soup
    (158, '{lunch,dinner}'::text[]),    -- Parsnip Tacos
    (159, '{dinner}'::text[]),          -- Orange-Flavored Parsnips and Carrots
    (160, '{dinner}'::text[]),          -- Sweet Baked Turnips and Apples
    (222, '{dinner}'::text[]),          -- Root Vegetable and Chicken Stew
    (224, '{snack}'::text[]),           -- Parsnip Fries
    (230, '{dinner}'::text[]),          -- Honey Roasted Parsnips and Apples
    (231, '{dinner}'::text[]),          -- Maple Glazed Chicken and Root Vegetables
    (249, '{dinner}'::text[]),          -- Beef and Root Vegetable Stew
    (251, '{dinner}'::text[]),          -- Root Vegetable Casserole
    (262, '{breakfast,snack}'::text[]), -- Parsnip and Apple Smoothie

    -- Sweet potato
    (161, '{dinner}'::text[]),          -- Boiled Sweet Potatoes
    (162, '{dinner}'::text[]),          -- Baked Sweet Potatoes
    (163, '{dinner}'::text[]),          -- Microwaved Sweet Potatoes
    (164, '{dinner}'::text[]),          -- Steamed Sweet Potatoes
    (165, '{dinner}'::text[]),          -- Stir-Fry Sweet Potatoes
    (166, '{dinner}'::text[]),          -- Baked Chicken with Peaches and Sweet Potatoes
    (167, '{lunch,dinner}'::text[]),    -- Sweet Potato Soup
    (168, '{snack}'::text[]),           -- Crispy Sweet Potato Fries
    (169, '{dinner}'::text[]),          -- Grandmother's Roasted Sweet Potatoes
    (170, '{lunch}'::text[]),           -- Sweet Potato and Black Bean Salad
    (171, '{dinner}'::text[]),          -- Sweet Potato with Onions
    (172, '{dinner}'::text[]),          -- Mashed Sweet Potatoes and White Potatoes
    (173, '{dinner}'::text[]),          -- Sweet Potatoes with Pineapple
    (174, '{dinner}'::text[]),          -- Lemon Sweet Potatoes
    (175, '{dinner}'::text[]),          -- Crock Pot Sweet Potatoes
    (176, '{snack}'::text[]),           -- Spicy Sweet Potato Spears
    (177, '{lunch}'::text[]),           -- Sweet Potatoes, Beans and Salsa
    (178, '{lunch}'::text[]),           -- Sweet Potato Salad
    (229, '{breakfast,snack}'::text[]), -- Sweet Potato Smoothie
    (250, '{snack}'::text[]),           -- Sweet Potato Chips
    (253, '{breakfast,dinner}'::text[]),-- Sweet Potato and Meat Hash
    (254, '{dinner}'::text[]),          -- Pork and Sweet Potato Stew
    (270, '{dinner}'::text[]),          -- Crock Pot Pork and Sweet Potatoes

    -- Zucchini
    (179, '{dinner}'::text[]),          -- Zucchini and Corn Fry
    (180, '{dinner}'::text[]),          -- Zucchini Hamburger Pie
    (181, '{dinner}'::text[]),          -- Zucchini Tomato Casserole
    (182, '{dinner}'::text[]),          -- Stuffed Zucchini
    (183, '{dinner}'::text[]),          -- Stove-Top Chicken with Zucchini and Tomatoes
    (184, '{dinner}'::text[]),          -- Roasted Zucchini
    (185, '{lunch,dinner}'::text[]),    -- Zucchini Burritos
    (186, '{dinner}'::text[]),          -- Zucchini Stuffing Side Dish
    (187, '{lunch,dinner}'::text[]),    -- Zucchini with Noodles
    (188, '{dinner}'::text[]),          -- Stove-Top Zucchini with Onions and Tomatoes
    (189, '{lunch}'::text[]),           -- Sweet and Sour Zucchini Salad
    (190, '{dinner}'::text[]),          -- Boiled Zucchini
    (191, '{dinner}'::text[]),          -- Stove-Top Parmesan Zucchini
    (192, '{dinner}'::text[]),          -- Crock Pot Zucchini and Tomatoes
    (193, '{dinner}'::text[]),          -- Steamed Zucchini
    (194, '{lunch}'::text[]),           -- Zucchini and Tomato Salad
    (195, '{dinner}'::text[]),          -- Microwaved Zucchini
    (196, '{dinner}'::text[]),          -- Country Zucchini Casserole
    (197, '{lunch,dinner}'::text[]),    -- Zucchini Soup
    (198, '{snack}'::text[]),           -- Crispy Zucchini Chips
    (199, '{dinner}'::text[]),          -- Zucchini and Sprout Stir Fry
    (200, '{dinner}'::text[]),          -- Chicken and Vegetable Enchilada Casserole
    (208, '{breakfast,lunch}'::text[]), -- Crustless Zucchini Pie
    (226, '{breakfast}'::text[]),       -- Zucchini Pancakes
    (238, '{dinner}'::text[]),          -- Baked Zucchini and Chicken
    (248, '{dinner}'::text[]),          -- Microwave Zucchini Parmesan
    (252, '{dinner}'::text[]),          -- Orange Chicken with Zucchini
    (261, '{breakfast,snack}'::text[]), -- Zucchini and Fruit Smoothie
    (264, '{lunch,snack}'::text[])      -- Tortilla Pizza with Zucchini
) AS s(id, meals)
WHERE EXISTS (SELECT 1 FROM recipe r WHERE r.id = s.id)
ON CONFLICT DO NOTHING;

-- The snacks tip for each vegetable.
INSERT INTO meal_label (kind, item_id, meal)
SELECT 'tip', t.id, 'snack'
FROM tip t
WHERE t.attribute = 'Snacks'
ON CONFLICT DO NOTHING;

COMMIT;