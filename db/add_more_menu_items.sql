-- SQL Script to Add 6 More Menu Items to Each of the 10 Restaurants (PostgreSQL / Supabase compatible)

-- ==========================================================
-- 1. Insert 60 New Menu Items (item_id 41 to 100)
-- ==========================================================
INSERT INTO menu_item (item_id, item_name, price, r_id, image_url) VALUES
-- Restaurant 1: Pizza Palace (r_id = 1)
(41, 'Spaghetti Bolognese', 290.00, 1, 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=500&auto=format&fit=crop&q=60'),
(42, 'Chicken Alfredo', 320.00, 1, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=60'),
(43, 'Caprese Bruschetta', 140.00, 1, 'https://images.unsplash.com/photo-1572656631137-7935297eff55?w=500&auto=format&fit=crop&q=60'),
(44, 'Minestrone Soup', 130.00, 1, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=60'),
(45, 'Four Cheese Pizza', 380.00, 1, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60'),
(46, 'Panna Cotta', 160.00, 1, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 2: Burger Bistro (r_id = 2)
(47, 'BBQ Bacon Burger', 220.00, 2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60'),
(48, 'Onion Rings', 90.00, 2, 'https://images.unsplash.com/photo-1639024471283-2da7b3c6a267?w=500&auto=format&fit=crop&q=60'),
(49, 'Grilled Chicken Wrap', 170.00, 2, 'https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=500&auto=format&fit=crop&q=60'),
(50, 'Mozzarella Sticks', 120.00, 2, 'https://images.unsplash.com/photo-1531749668029-2db88e4b76ce?w=500&auto=format&fit=crop&q=60'),
(51, 'Double Patty Monster', 260.00, 2, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60'),
(52, 'Chocolate Milkshake', 110.00, 2, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 3: Sushi House (r_id = 3)
(53, 'Tuna Sashimi', 420.00, 3, 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=500&auto=format&fit=crop&q=60'),
(54, 'Chicken Teriyaki Bowl', 280.00, 3, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&auto=format&fit=crop&q=60'),
(55, 'Edamame Beans', 100.00, 3, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=60'),
(56, 'Shrimp Tempura Roll', 360.00, 3, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60'),
(57, 'Pork Gyoza', 190.00, 3, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60'),
(58, 'Dorayaki Pancakes', 130.00, 3, 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 4: Spice Symphony (r_id = 4)
(59, 'Paneer Tikka', 260.00, 4, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60'),
(60, 'Dal Tadka', 180.00, 4, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60'),
(61, 'Laccha Paratha', 50.00, 4, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60'),
(62, 'Chicken Tikka Masala', 390.00, 4, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60'),
(63, 'Mango Lassi', 90.00, 4, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60'),
(64, 'Gulab Jamun', 80.00, 4, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 5: The Green Bowl (r_id = 5)
(65, 'Greek Salad', 190.00, 5, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60'),
(66, 'Sweet Potato Fries', 110.00, 5, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&auto=format&fit=crop&q=60'),
(67, 'Hummus & Pita', 160.00, 5, 'https://images.unsplash.com/photo-1577906096429-f73cf178c24b?w=500&auto=format&fit=crop&q=60'),
(68, 'Tofu Grain Bowl', 230.00, 5, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'),
(69, 'Berry Protein Shake', 150.00, 5, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60'),
(70, 'Chia Seed Pudding', 120.00, 5, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 6: Wok & Roll (r_id = 6)
(71, 'Spring Rolls', 120.00, 6, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60'),
(72, 'Hot & Sour Soup', 110.00, 6, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=60'),
(73, 'Chilli Chicken', 240.00, 6, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=60'),
(74, 'Schezwan Fried Rice', 170.00, 6, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=60'),
(75, 'Honey Chilli Potato', 160.00, 6, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60'),
(76, 'Fried Ice Cream', 130.00, 6, 'https://images.unsplash.com/photo-1505394033343-40a6900743f1?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 7: Sweet Treats Bakery (r_id = 7)
(77, 'Butter Croissant', 90.00, 7, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60'),
(78, 'Macaron Box of 4', 240.00, 7, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&auto=format&fit=crop&q=60'),
(79, 'Vanilla Creme Brulee', 160.00, 7, 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=500&auto=format&fit=crop&q=60'),
(80, 'Blueberry Muffin', 90.00, 7, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500&auto=format&fit=crop&q=60'),
(81, 'Apple Pie Slice', 140.00, 7, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=500&auto=format&fit=crop&q=60'),
(82, 'Iced Americano', 100.00, 7, 'https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 8: Taco Fiesta (r_id = 8)
(83, 'Crunchy Beef Taco', 160.00, 8, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=60'),
(84, 'Grilled Chicken Burrito', 220.00, 8, 'https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=500&auto=format&fit=crop&q=60'),
(85, 'Churros with Chocolate', 130.00, 8, 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=60'),
(86, 'Cheese Enchiladas', 180.00, 8, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=60'),
(87, 'Mexican Rice Bowl', 190.00, 8, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'),
(88, 'Virgin Piña Colada', 120.00, 8, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 9: The Curry House (r_id = 9)
(89, 'Paneer Tikka Masala', 280.00, 9, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60'),
(90, 'Malai Kofta', 270.00, 9, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60'),
(91, 'Garlic Naan', 50.00, 9, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60'),
(92, 'Veg Biryani', 220.00, 9, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60'),
(93, 'Masala Papad', 40.00, 9, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60'),
(94, 'Rasmalai', 90.00, 9, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60'),

-- Restaurant 10: Cafe Coffee Day (r_id = 10)
(95, 'Cold Coffee with Ice Cream', 160.00, 10, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60'),
(96, 'Hazelnut Latte', 140.00, 10, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60'),
(97, 'Veg Cheese Grilled Sandwich', 120.00, 10, 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60'),
(98, 'French Fries', 90.00, 10, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60'),
(99, 'Chocolate Brownie', 110.00, 10, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60'),
(100, 'Green Tea', 80.00, 10, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60');

-- ==========================================================
-- 2. Synchronize sequences to match the maximum ID (100)
-- ==========================================================
SELECT setval(pg_get_serial_sequence('menu_item', 'item_id'), COALESCE(MAX(item_id), 1)) FROM menu_item;
