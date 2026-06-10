-- SQL Script to add Image URLs to FoodExpress (Supabase PostgreSQL Compatible)

-- ==========================================================
-- 1. Add Columns to Tables
-- ==========================================================
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE menu_item ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- ==========================================================
-- 2. Seed Restaurant Images
-- ==========================================================
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 1;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 2;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 3;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1585938338392-50a592202f72?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 4;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 5;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 6;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 7;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 8;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 9;
UPDATE restaurant SET image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60' WHERE restaurantId = 10;

-- ==========================================================
-- 3. Seed Menu Item Images
-- ==========================================================

-- Pizza Palace (r_id = 1)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60' WHERE item_id = 1;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60' WHERE item_id = 2;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=500&auto=format&fit=crop&q=60' WHERE item_id = 3;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60' WHERE item_id = 4;

-- Burger Bistro (r_id = 2)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' WHERE item_id = 5;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60' WHERE item_id = 6;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=60' WHERE item_id = 7;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60' WHERE item_id = 8;

-- Sushi House (r_id = 3)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&auto=format&fit=crop&q=60' WHERE item_id = 9;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&auto=format&fit=crop&q=60' WHERE item_id = 10;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60' WHERE item_id = 11;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1505394033343-40a6900743f1?w=500&auto=format&fit=crop&q=60' WHERE item_id = 12;

-- Spice Symphony (r_id = 4)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60' WHERE item_id = 13;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60' WHERE item_id = 14;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60' WHERE item_id = 15;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60' WHERE item_id = 16;

-- The Green Bowl (r_id = 5)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop&q=60' WHERE item_id = 17;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60' WHERE item_id = 18;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=60' WHERE item_id = 19;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60' WHERE item_id = 20;

-- Wok & Roll (r_id = 6)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60' WHERE item_id = 21;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=60' WHERE item_id = 22;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=60' WHERE item_id = 23;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=60' WHERE item_id = 24;

-- Sweet Treats Bakery (r_id = 7)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60' WHERE item_id = 25;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?w=500&auto=format&fit=crop&q=60' WHERE item_id = 26;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=60' WHERE item_id = 27;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60' WHERE item_id = 28;

-- Taco Fiesta (r_id = 8)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=500&auto=format&fit=crop&q=60' WHERE item_id = 29;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=60' WHERE item_id = 30;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60' WHERE item_id = 31;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60' WHERE item_id = 32;

-- The Curry House (r_id = 9)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' WHERE item_id = 33;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60' WHERE item_id = 34;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60' WHERE item_id = 35;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&auto=format&fit=crop&q=60' WHERE item_id = 36;

-- Cafe Coffee Day (r_id = 10)
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60' WHERE item_id = 37;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60' WHERE item_id = 38;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60' WHERE item_id = 39;
UPDATE menu_item SET image_url = 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&auto=format&fit=crop&q=60' WHERE item_id = 40;
