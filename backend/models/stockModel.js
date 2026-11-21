// ---------------------------------------------------------------
// models/stockModel.js
// Stock is stored per fruit + packaging size (SMALL / MEDIUM / LARGE).
// ---------------------------------------------------------------
const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(
    `SELECT s.stock_id, s.fruit_id, f.fruit_name, s.packaging_size,
            s.available_quantity, s.reorder_level, s.updated_at,
            (s.available_quantity <= s.reorder_level) AS is_low_stock
       FROM stock s
       JOIN fruits f ON f.fruit_id = s.fruit_id
      ORDER BY f.fruit_name,
               FIELD(s.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`
  );
  return rows;
}

async function findLowStock() {
  const [rows] = await pool.query(
    `SELECT s.stock_id, s.fruit_id, f.fruit_name, s.packaging_size,
            s.available_quantity, s.reorder_level,
            CASE WHEN s.available_quantity = 0 THEN 'OUT_OF_STOCK' ELSE 'LOW' END AS warning
       FROM stock s
       JOIN fruits f ON f.fruit_id = s.fruit_id
      WHERE s.available_quantity <= s.reorder_level
      ORDER BY s.available_quantity ASC, f.fruit_name`
  );
  return rows;
}

async function findByFruitAndSize(fruitId, packagingSize) {
  const [rows] = await pool.query(
    `SELECT s.*, f.fruit_name
       FROM stock s
       JOIN fruits f ON f.fruit_id = s.fruit_id
      WHERE s.fruit_id = ? AND s.packaging_size = ?`,
    [fruitId, packagingSize]
  );
  return rows[0] || null;
}

/** Total boxes in the warehouse (dashboard card). */
async function totalBoxes() {
  const [rows] = await pool.query('SELECT COALESCE(SUM(available_quantity), 0) AS total FROM stock');
  return rows[0].total;
}

module.exports = { findAll, findLowStock, findByFruitAndSize, totalBoxes };
