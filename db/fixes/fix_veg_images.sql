-- Corrects vegetable thumbnail paths.
--
-- The source data's image_id references were wrong: all ten vegetables
-- pointed at broccoli assets under recipe/BR-2xx/. The original app's stock
-- vegetable photos were found in images/stock/ and are used here instead.
--
-- Applied to the live database 2026-09-09. This file exists so the fix is not
-- lost if the database is rebuilt from seed.py. The permanent fix belongs in
-- seed.py itself.

UPDATE vegetable SET image_path = 'stock/broccoli.jpg'      WHERE code = 'BROCCOLI';
UPDATE vegetable SET image_path = 'stock/cabbage.jpg'       WHERE code = 'CABBAGE';
UPDATE vegetable SET image_path = 'stock/carrot.jpg'        WHERE code = 'CARROT';
UPDATE vegetable SET image_path = 'stock/cauliflower.jpg'   WHERE code = 'CAULIFLOWER';
UPDATE vegetable SET image_path = 'stock/greenbean.jpg'     WHERE code = 'GREENBEAN';
UPDATE vegetable SET image_path = 'stock/onion.jpg'         WHERE code = 'ONION';
UPDATE vegetable SET image_path = 'stock/potato.jpg'        WHERE code = 'POTATO';
UPDATE vegetable SET image_path = 'stock/rootvegetable.jpg' WHERE code = 'ROOTVEGETABLE';
UPDATE vegetable SET image_path = 'stock/sweetpotato.jpg'   WHERE code = 'SWEETPOTATO';
UPDATE vegetable SET image_path = 'stock/zucchini.jpg'      WHERE code = 'ZUCCHINI';
