-- 1) Orders table (parent)
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  restaurant_id INT NOT NULL,
  delivery_partner_id INT,
  eta_minutes INT,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('PREPARING','OUT_FOR_DELIVERY','DELIVERED') DEFAULT 'PREPARING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2) Order Items (child)
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  item_id INT,
  item_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  qty INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- 3) Minimal audit tables for triggers
CREATE TABLE IF NOT EXISTS order_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  message VARCHAR(255),
  log_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT,
  r_id INT,
  message VARCHAR(255),
  log_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$

-- after a new order
DROP TRIGGER IF EXISTS trg_orders_after_insert$$
CREATE TRIGGER trg_orders_after_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  INSERT INTO order_audit(order_id, message)
  VALUES(NEW.order_id, CONCAT('Order placed for restaurant ', NEW.restaurant_id, ' with total ', NEW.total_amount));
END$$

-- after order item insert
DROP TRIGGER IF EXISTS trg_order_items_after_insert$$
CREATE TRIGGER trg_order_items_after_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  INSERT INTO order_audit(order_id, message)
  VALUES(NEW.order_id, CONCAT('Item added: ', NEW.item_name, ' x', NEW.qty));
END$$

-- when a menu item is added
DROP TRIGGER IF EXISTS trg_menu_item_after_insert$$
CREATE TRIGGER trg_menu_item_after_insert
AFTER INSERT ON menu_item
FOR EACH ROW
BEGIN
  INSERT INTO menu_audit(item_id, r_id, message)
  VALUES(NEW.item_id, NEW.r_id, CONCAT('New item added: ', NEW.item_name, ' @ ', NEW.price));
END$$

-- when a menu item is updated
DROP TRIGGER IF EXISTS trg_menu_item_after_update$$
CREATE TRIGGER trg_menu_item_after_update
AFTER UPDATE ON menu_item
FOR EACH ROW
BEGIN
  INSERT INTO menu_audit(item_id, r_id, message)
  VALUES(NEW.item_id, NEW.r_id, CONCAT('Item updated: ', NEW.item_name, ' new price ', NEW.price));
END$$

DELIMITER ;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);