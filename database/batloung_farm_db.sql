-- =====================================================================
-- BATLOUNG FARM — FRESH PRODUCE DISTRIBUTION MANAGEMENT SYSTEM
-- PART A : DATABASE CREATION SCRIPT
-- File     : database/batloung_farm_db.sql
-- DBMS     : MySQL 8.0+ (also works on MySQL 5.7 / MariaDB 10.4+)
-- Run with : mysql -u root -p < database/batloung_farm_db.sql
--
-- WHAT THIS SCRIPT DOES
--   1. Drops and re-creates the database batloung_farm_db (so it can be
--      re-run safely during development).
--   2. Creates the 8 required tables in the correct order (parents first,
--      so the foreign keys always have something to point at).
--   3. Inserts realistic sample data for Maseru (Lesotho) and South Africa.
--   4. Creates 2 helper views + the 4 required reports used by the backend.
-- =====================================================================

DROP DATABASE IF EXISTS batloung_farm_db;
CREATE DATABASE batloung_farm_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE batloung_farm_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE suppliers (
    supplier_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    business_name   VARCHAR(120)    NOT NULL,
    contact_person  VARCHAR(100)    NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    province        VARCHAR(40)     NOT NULL,
    address         VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_suppliers PRIMARY KEY (supplier_id),

  
    CONSTRAINT uq_suppliers_business_name UNIQUE (business_name),

  
    CONSTRAINT uq_suppliers_phone UNIQUE (phone),

    
    CONSTRAINT ck_suppliers_province CHECK (
        province IN (
            'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
            'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West',
            'Western Cape'
        )
    ),

    
    CONSTRAINT ck_suppliers_phone CHECK (phone REGEXP '^[0-9()+ -]{9,20}$')
) ENGINE = InnoDB;


CREATE TABLE fruits (
    fruit_id     INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    fruit_name   VARCHAR(80)    NOT NULL,
    description  VARCHAR(255)   NOT NULL DEFAULT '',
    status       ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_fruits PRIMARY KEY (fruit_id),

    CONSTRAINT uq_fruits_fruit_name UNIQUE (fruit_name),

    CONSTRAINT ck_fruits_name CHECK (CHAR_LENGTH(TRIM(fruit_name)) >= 2)
) ENGINE = InnoDB;


CREATE TABLE vendors (
    vendor_id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    vendor_name        VARCHAR(120)  NOT NULL,
    phone_number       VARCHAR(20)   NOT NULL,
    location           VARCHAR(120)  NOT NULL,
    registration_date  DATE          NOT NULL,
    created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_vendors PRIMARY KEY (vendor_id),

    CONSTRAINT uq_vendors_phone_number UNIQUE (phone_number),

    CONSTRAINT ck_vendors_phone CHECK (phone_number REGEXP '^[0-9()+ -]{8,20}$'),

    KEY idx_vendors_name (vendor_name),
    KEY idx_vendors_phone (phone_number)
) ENGINE = InnoDB;


CREATE TABLE purchases (
    purchase_id    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    supplier_id    INT UNSIGNED    NOT NULL,
    purchase_date  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    status         ENUM('COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_purchases PRIMARY KEY (purchase_id),

    CONSTRAINT fk_purchases_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id)
        ON UPDATE CASCADE

    CONSTRAINT ck_purchases_total CHECK (total_amount >= 0),

    KEY idx_purchases_supplier (supplier_id),
    KEY idx_purchases_date (purchase_date)
) ENGINE = InnoDB;


CREATE TABLE purchase_details (
    purchase_detail_id  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    purchase_id         INT UNSIGNED   NOT NULL,
    fruit_id            INT UNSIGNED   NOT NULL,
    quantity            INT UNSIGNED   NOT NULL,                -- boxes bought
    unit_cost           DECIMAL(10,2)  NOT NULL,                -- R per box
    packaging_size      ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
    line_total          DECIMAL(12,2)
        GENERATED ALWAYS AS (quantity * unit_cost) STORED,

    CONSTRAINT pk_purchase_details PRIMARY KEY (purchase_detail_id),

    CONSTRAINT fk_pd_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases (purchase_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_pd_fruit
        FOREIGN KEY (fruit_id) REFERENCES fruits (fruit_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT ck_pd_quantity CHECK (quantity > 0),
    CONSTRAINT ck_pd_unit_cost CHECK (unit_cost > 0),

    CONSTRAINT uq_pd_purchase_fruit_pack UNIQUE (purchase_id, fruit_id, packaging_size),

    KEY idx_pd_fruit (fruit_id)
) ENGINE = InnoDB;


CREATE TABLE sales (
    sale_id           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    vendor_id         INT UNSIGNED   NOT NULL,
    sale_date         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_status    ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
    payment_method    ENUM('CASH','MOBILE_MONEY','CREDIT')  NOT NULL DEFAULT 'CASH',
    total_amount      DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    amount_paid       DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    outstanding_balance DECIMAL(12,2)
        GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_sales PRIMARY KEY (sale_id),

    CONSTRAINT fk_sales_vendor
        FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT ck_sales_total CHECK (total_amount >= 0),
    CONSTRAINT ck_sales_paid  CHECK (amount_paid >= 0 AND amount_paid <= total_amount),

    KEY idx_sales_vendor (vendor_id),
    KEY idx_sales_date (sale_date),
    KEY idx_sales_payment_status (payment_status)
) ENGINE = InnoDB;


CREATE TABLE sales_details (
    sales_detail_id  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    sale_id          INT UNSIGNED   NOT NULL,
    fruit_id         INT UNSIGNED   NOT NULL,
    packaging_size   ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
    quantity         INT UNSIGNED   NOT NULL,                   -- boxes sold
    unit_price       DECIMAL(10,2)  NOT NULL,                   -- R per box
    line_total       DECIMAL(12,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,

    CONSTRAINT pk_sales_details PRIMARY KEY (sales_detail_id),

    CONSTRAINT fk_sd_sale
        FOREIGN KEY (sale_id) REFERENCES sales (sale_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_sd_fruit
        FOREIGN KEY (fruit_id) REFERENCES fruits (fruit_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT ck_sd_quantity CHECK (quantity > 0),
    CONSTRAINT ck_sd_unit_price CHECK (unit_price > 0),

    CONSTRAINT uq_sd_sale_fruit_pack UNIQUE (sale_id, fruit_id, packaging_size),

    KEY idx_sd_fruit (fruit_id)
) ENGINE = InnoDB;


CREATE TABLE stock (
    stock_id            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    fruit_id            INT UNSIGNED   NOT NULL,
    packaging_size      ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
    available_quantity  INT            NOT NULL DEFAULT 0,
    reorder_level       INT UNSIGNED   NOT NULL DEFAULT 10,
    updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_stock PRIMARY KEY (stock_id),

    CONSTRAINT fk_stock_fruit
        FOREIGN KEY (fruit_id) REFERENCES fruits (fruit_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT uq_stock_fruit_pack UNIQUE (fruit_id, packaging_size),

    CONSTRAINT ck_stock_quantity CHECK (available_quantity >= 0)
) ENGINE = InnoDB;


CREATE TABLE payments (
    payment_id      INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    sale_id         INT UNSIGNED   NOT NULL,
    amount          DECIMAL(12,2)  NOT NULL,
    payment_method  ENUM('CASH','MOBILE_MONEY','BANK_TRANSFER') NOT NULL,
    payment_date    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference       VARCHAR(80)    NOT NULL DEFAULT '',
    notes           VARCHAR(255)   NOT NULL DEFAULT '',

    CONSTRAINT pk_payments PRIMARY KEY (payment_id),

    CONSTRAINT fk_payments_sale
        FOREIGN KEY (sale_id) REFERENCES sales (sale_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT ck_payments_amount CHECK (amount > 0),

    KEY idx_payments_sale (sale_id),
    KEY idx_payments_date (payment_date)
) ENGINE = InnoDB;



INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES
('Ceres Fruit Growers',         'Pieter van Wyk',   '0213932200', 'Western Cape',  '1 Voortrekker Road, Ceres, 6835'),
('Vredendal Vine & Produce',    'Anna Louw',        '0272133321', 'Western Cape',  '22 Kerk Street, Vredendal, 8160'),
('Tzaneen Tropical Fruits',     'Thabo Mahlangu',   '0153071122', 'Limpopo',       '18 Agatha Street, Tzaneen, 0850'),
('Hoedspruit Citrus Co.',       'Lerato Nkosi',     '0157931444', 'Limpopo',       '5 Safari Boulevard, Hoedspruit, 1380'),
('Mbombela Fresh Produce',      'Sipho Ndlovu',     '0137526655', 'Mpumalanga',    '41 Samora Machel Drive, Mbombela, 1200'),
('Nelspruit Banana Growers',    'Maria Dlamini',    '0137412200', 'Mpumalanga',    '9 Riverside Road, Mbombela, 1200'),
('Bloemfontein Agri Supplies',  'Jan Steyn',        '0514478899', 'Free State',    '33 Nelson Mandela Drive, Bloemfontein, 9301'),
('Kimberley Produce Depot',     'Naledi Sekhoto',   '0538317700', 'Northern Cape', '7 Memorial Road, Kimberley, 8301'),
('Durban Banana Exchange',      'Rajesh Naidoo',    '0313326655', 'KwaZulu-Natal', '15 Point Road, Durban, 4001'),
('East London Fruit Traders',   'Zanele Mbeki',     '0437221100', 'Eastern Cape',  '3 Oxford Street, East London, 5201'),
('Rustenburg Produce Wholesale','Kabelo Mokoena',   '0145923344', 'North West',    '60 Boom Street, Rustenburg, 0299'),
('Johannesburg Fresh Market',   'Anele Mthembu',    '0118365500', 'Gauteng',       '12 Market Street, City Deep, Johannesburg, 2049');

INSERT INTO fruits (fruit_name, description, status) VALUES
('Apples',      'Crisp red and green apples, graded for the street trade', 'ACTIVE'),
('Bananas',     'Ripe yellow bananas, sold in whole boxes',                 'ACTIVE'),
('Oranges',     'Sweet Valencia oranges from Limpopo',                     'ACTIVE'),
('Grapes',      'Seedless white and red table grapes',                      'ACTIVE'),
('Pears',       'Juicy Packham pears',                                      'ACTIVE'),
('Mangoes',     'Ripe tropical mangoes from Tzaneen',                       'ACTIVE'),
('Lemons',      'Thin-skinned lemons for resale',                           'ACTIVE'),
('Peaches',     'Freestone peaches, summer crop',                           'ACTIVE'),
('Watermelons', 'Large field-grown watermelons',                            'ACTIVE'),
('Avocados',    'Hass avocados, export quality',                            'INACTIVE');

INSERT INTO vendors (vendor_name, phone_number, location, registration_date) VALUES
('Maseru Main Market Stall 12',  '+266 5800 1122', 'Maseru Market, Maseru',    '2024-02-14'),
('Thabo Fruit Corner',           '+266 5811 2233', 'Maseru Mall Road, Maseru', '2024-03-02'),
('Lerato Street Fruits',         '+266 5822 3344', 'Lancers Road, Maseru',     '2024-03-18'),
('Mahlape Grocers',              '+266 5833 4455', 'Ha Thetsane, Maseru',      '2024-04-05'),
('Sello Mini Market',            '+266 5844 5566', 'Mabote, Maseru',           '2024-05-11'),
('Dineo Fruit & Veg',            '+266 5855 6677', 'Roma Road, Maseru',        '2024-06-20'),
('Mokhethi Superette',           '+266 5866 7788', 'Lithabaneng, Maseru',      '2024-08-09'),
('Nthabiseng Fresh Produce',     '+266 5877 8899', 'Teyateyaneng, Berea',      '2025-01-15'),
('Khotso Traders',               '+266 5988 9900', 'Maputsoe, Leribe',         '2025-02-27'),
('Palesa Corner Shop',           '+266 5999 1010', 'Mafeteng Town',            '2025-04-12');

INSERT INTO stock (fruit_id, packaging_size, available_quantity, reorder_level) VALUES
(1,'SMALL', 120, 20), (1,'MEDIUM',  85, 15), (1,'LARGE',   6, 10),   -- Apples
(2,'SMALL', 200, 25), (2,'MEDIUM', 140, 20), (2,'LARGE',  45, 12),   -- Bananas
(3,'SMALL', 160, 20), (3,'MEDIUM',  95, 15), (3,'LARGE',  38, 10),   -- Oranges
(4,'SMALL',  60, 15), (4,'MEDIUM',  40, 10), (4,'LARGE',   8,  8),   -- Grapes
(5,'SMALL',  90, 15), (5,'MEDIUM',  55, 12), (5,'LARGE',  22,  8),   -- Pears
(6,'SMALL',  75, 15), (6,'MEDIUM',  30, 10), (6,'LARGE',  12,  8),   -- Mangoes
(7,'SMALL', 130, 20), (7,'MEDIUM',  70, 15), (7,'LARGE',  25, 10),   -- Lemons
(8,'SMALL',  45, 12), (8,'MEDIUM',  28, 10), (8,'LARGE',   4,  8),   -- Peaches
(9,'SMALL',  35, 10), (9,'MEDIUM',  20,  8), (9,'LARGE',  15,  6),   -- Watermelons
(10,'SMALL',  0,  5), (10,'MEDIUM',  0,  5), (10,'LARGE',  0,  5);   -- Avocados (inactive)


INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES
(1, '2026-09-02 08:30:00', 0),
(3, '2026-09-05 09:15:00', 0),
(9, '2026-09-09 10:00:00', 0),
(2, '2026-09-14 07:45:00', 0),
(5, '2026-09-19 11:20:00', 0),
(12,'2026-09-23 08:05:00', 0),
(4, '2026-10-01 09:40:00', 0),
(6, '2026-10-06 10:30:00', 0),
(7, '2026-10-12 08:10:00', 0),
(10,'2026-10-20 09:00:00', 0);

INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES
( 1, 1, 40, 180.00, 'MEDIUM'),
( 1, 5, 25, 165.00, 'MEDIUM'),
( 2, 6, 30, 210.00, 'LARGE'),
( 2, 3, 50,  95.00, 'SMALL'),
( 3, 2, 60,  88.00, 'LARGE'),
( 3, 2, 80,  45.00, 'SMALL'),
( 4, 4, 20, 260.00, 'MEDIUM'),
( 4, 7, 45, 110.00, 'MEDIUM'),
( 5, 3, 70,  92.00, 'MEDIUM'),
( 5, 8, 30, 140.00, 'SMALL'),
( 6, 1, 60, 175.00, 'MEDIUM'),
( 6, 9, 18, 120.00, 'LARGE'),
( 7, 6, 40, 205.00, 'LARGE'),
( 7, 6, 35,  98.00, 'SMALL'),
( 8, 2, 90,  85.00, 'LARGE'),
( 8, 4, 25, 255.00, 'SMALL'),
( 9, 7, 55, 105.00, 'LARGE'),
( 9, 3, 65,  90.00, 'SMALL'),
(10, 5, 40, 160.00, 'SMALL'),
(10, 8, 22, 135.00, 'SMALL');

UPDATE purchases p
SET p.total_amount = (
    SELECT COALESCE(SUM(d.quantity * d.unit_cost), 0)
    FROM purchase_details d
    WHERE d.purchase_id = p.purchase_id
);

INSERT INTO sales (vendor_id, sale_date, payment_status, payment_method, total_amount, amount_paid) VALUES
( 1, '2026-09-03 09:00:00', 'PAID',           'CASH',         0, 0),
( 2, '2026-09-06 10:30:00', 'PAID',           'MOBILE_MONEY', 0, 0),
( 3, '2026-09-10 08:45:00', 'PARTIALLY_PAID', 'CASH',         0, 0),
( 4, '2026-09-15 11:00:00', 'UNPAID',         'CREDIT',       0, 0),
( 5, '2026-09-20 09:20:00', 'PAID',           'CASH',         0, 0),
( 1, '2026-09-25 10:10:00', 'PARTIALLY_PAID', 'MOBILE_MONEY', 0, 0),
( 6, '2026-10-02 08:00:00', 'PAID',           'CASH',         0, 0),
( 7, '2026-10-07 12:00:00', 'UNPAID',         'CREDIT',       0, 0),
( 2, '2026-10-13 09:30:00', 'PAID',           'MOBILE_MONEY', 0, 0),
( 8, '2026-10-21 10:45:00', 'PARTIALLY_PAID', 'CASH',         0, 0),
( 1, '2026-11-02 09:00:00', 'PAID',           'CASH',         0, 0),
( 9, '2026-11-05 10:15:00', 'UNPAID',         'CREDIT',       0, 0),
( 3, '2026-11-10 08:30:00', 'PAID',           'MOBILE_MONEY', 0, 0),
(10, '2026-11-12 11:30:00', 'PARTIALLY_PAID', 'CASH',         0, 0);

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
( 1, 1, 'MEDIUM', 10, 240.00),
( 1, 2, 'SMALL',  20,  70.00),
( 2, 2, 'LARGE',  15, 125.00),
( 2, 3, 'SMALL',  18,  65.00),
( 3, 1, 'MEDIUM', 12, 245.00),
( 3, 6, 'LARGE',   8, 290.00),
( 4, 3, 'MEDIUM', 20, 130.00),
( 4, 7, 'MEDIUM', 15, 150.00),
( 5, 4, 'MEDIUM', 10, 340.00),
( 5, 5, 'SMALL',  12, 110.00),
( 6, 2, 'SMALL',  25,  72.00),
( 6, 9, 'LARGE',   6, 160.00),
( 7, 1, 'MEDIUM', 15, 238.00),
( 7, 8, 'SMALL',  10, 105.00),
( 8, 6, 'LARGE',  10, 285.00),
( 8, 2, 'SMALL',  30,  68.00),
( 9, 4, 'SMALL',  12, 180.00),
( 9, 7, 'LARGE',  10, 145.00),
(10, 3, 'SMALL',  25,  62.00),
(10, 5, 'MEDIUM',  8, 205.00),
(11, 1, 'LARGE',   4, 380.00),
(11, 2, 'MEDIUM', 20, 100.00),
(12, 6, 'SMALL',  18, 128.00),
(12, 9, 'MEDIUM',  5, 145.00),
(13, 7, 'MEDIUM', 22, 148.00),
(13, 3, 'MEDIUM', 15, 128.00),
(14, 5, 'SMALL',  14, 112.00),
(14, 8, 'SMALL',   9, 108.00);

UPDATE sales s
SET s.total_amount = (
    SELECT COALESCE(SUM(d.quantity * d.unit_price), 0)
    FROM sales_details d
    WHERE d.sale_id = s.sale_id
);

UPDATE sales SET amount_paid = total_amount                  WHERE payment_status = 'PAID';
UPDATE sales SET amount_paid = ROUND(total_amount * 0.50) WHERE payment_status = 'PARTIALLY_PAID';
UPDATE sales SET amount_paid = 0                             WHERE payment_status = 'UNPAID';


INSERT INTO payments (sale_id, amount, payment_method, payment_date, reference, notes)
SELECT sale_id,
       amount_paid,
       CASE WHEN payment_method = 'MOBILE_MONEY' THEN 'MOBILE_MONEY' ELSE 'CASH' END,
       DATE_ADD(sale_date, INTERVAL 1 DAY),
       CONCAT('PAY-', LPAD(sale_id, 5, '0')),
       CASE WHEN payment_status = 'PARTIALLY_PAID'
            THEN 'Part payment received' ELSE 'Full payment received' END
FROM sales
WHERE amount_paid > 0;


CREATE VIEW v_dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM suppliers)                          AS total_suppliers,
    (SELECT COUNT(*) FROM vendors)                            AS total_vendors,
    (SELECT COUNT(*) FROM fruits WHERE status = 'ACTIVE')     AS total_fruits,
    (SELECT COALESCE(SUM(available_quantity), 0) FROM stock)  AS total_stock_boxes,
    (SELECT COALESCE(SUM(total_amount), 0) FROM sales)        AS total_sales_revenue,
    (SELECT COALESCE(SUM(outstanding_balance), 0) FROM sales) AS total_outstanding_balance;


CREATE VIEW v_report_top_fruits AS
SELECT
    f.fruit_id,
    f.fruit_name,
    SUM(d.quantity)                AS boxes_sold,
    COUNT(DISTINCT d.sale_id)      AS times_sold,
    SUM(d.quantity * d.unit_price) AS revenue
FROM sales_details d
JOIN fruits f ON f.fruit_id = d.fruit_id
JOIN sales  s ON s.sale_id  = d.sale_id
GROUP BY f.fruit_id, f.fruit_name
ORDER BY boxes_sold DESC
LIMIT 5;


CREATE VIEW v_report_revenue AS
SELECT
    DATE(s.sale_date)              AS sale_day,
    COUNT(DISTINCT s.sale_id)      AS number_of_sales,
    SUM(d.quantity)                AS boxes_sold,
    SUM(d.quantity * d.unit_price) AS revenue
FROM sales s
JOIN sales_details d ON d.sale_id = s.sale_id
GROUP BY DATE(s.sale_date)
ORDER BY sale_day;


CREATE VIEW v_report_top_vendor AS
SELECT
    v.vendor_id,
    v.vendor_name,
    v.phone_number,
    v.location,
    SUM(d.quantity)                AS total_boxes,
    COUNT(DISTINCT s.sale_id)      AS number_of_purchases,
    SUM(d.quantity * d.unit_price) AS total_spent
FROM sales s
JOIN sales_details d ON d.sale_id = s.sale_id
JOIN vendors v       ON v.vendor_id = s.vendor_id
GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location
ORDER BY total_boxes DESC, total_spent DESC
LIMIT 1;


CREATE VIEW v_report_current_stock AS
SELECT
    f.fruit_id,
    f.fruit_name,
    s.packaging_size,
    s.available_quantity,
    s.reorder_level,
    CASE WHEN s.available_quantity = 0                THEN 'OUT_OF_STOCK'
         WHEN s.available_quantity <= s.reorder_level THEN 'LOW'
         ELSE 'OK' END                            AS stock_status
FROM stock s
JOIN fruits f ON f.fruit_id = s.fruit_id
ORDER BY f.fruit_name, FIELD(s.packaging_size, 'SMALL', 'MEDIUM', 'LARGE');


-- =====================================================================
-- CHECKS — run these after importing to confirm Part A worked
-- =====================================================================
-- SELECT * FROM v_dashboard_summary;
-- SELECT * FROM v_report_top_fruits;
-- SELECT * FROM v_report_top_vendor;
-- SELECT * FROM v_report_current_stock;
-- SELECT sale_day, revenue FROM v_report_revenue
--    WHERE sale_day BETWEEN '2026-09-01' AND '2026-10-31';

