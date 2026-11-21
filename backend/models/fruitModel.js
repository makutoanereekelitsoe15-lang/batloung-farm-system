// ---------------------------------------------------------------
// models/fruitModel.js
// All fruit + fruit-stock SQL. When a new fruit is registered we also
// create its three stock buckets (SMALL / MEDIUM / LARGE) so that
// stock is always tracked separately per fruit and packaging size.
// ---------------------------------------------------------------
const { pool } = require('../config/db');

const PACKAGING_SIZES = ['SMALL', 'MEDIUM', 'LARGE'];

async function findAll(options) {
  const settings = options || {};
  const where = [];
  const params = [];

  if (settings.status) {
    where.push('f.status = ?');
    params.push(settings.status);
  }

  const sql =
    `SELECT f.fruit_id, f.fruit_name, f.description, f.status, f.created_at,
            COALESCE(SUM(s.available_quantity), 0) AS total_boxes
       FROM fruits f
       LEFT JOIN stock s ON s.fruit_id = f.fruit_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY f.fruit_id, f.fruit_name, f.description, f.status, f.created_at
      ORDER BY f.fruit_name`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(fruitId) {
  const [rows] = await pool.query('SELECT * FROM fruits WHERE fruit_id = ?', [fruitId]);
  return rows[0] || null;
}

async function findByName(fruitName) {
  const [rows] = await pool.query('SELECT * FROM fruits WHERE fruit_name = ?', [fruitName]);
  return rows[0] || null;
}

/**
 * Register a fruit AND create its three stock rows in one transaction,
 * so a fruit can never exist without stock records.
 */
async function create(fruit) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO fruits (fruit_name, description, status) VALUES (?, ?, ?)',
      [fruit.fruit_name, fruit.description, fruit.status]
    );

    const fruitId = result.insertId;

    // Give every fruit its own SMALL / MEDIUM / LARGE stock bucket.
    for (const size of PACKAGING_SIZES) {
      await connection.query(
        'INSERT INTO stock (fruit_id, packaging_size, available_quantity, reorder_level) VALUES (?, ?, 0, ?)',
        [fruitId, size, size === 'LARGE' ? 8 : 15]
      );
    }

    await connection.commit();
    return findById(fruitId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update(fruitId, fruit) {
  await pool.query(
    'UPDATE fruits SET fruit_name = ?, description = ?, status = ? WHERE fruit_id = ?',
    [fruit.fruit_name, fruit.description, fruit.status, fruitId]
  );
  return findById(fruitId);
}

async function remove(fruitId) {
  const [result] = await pool.query('DELETE FROM fruits WHERE fruit_id = ?', [fruitId]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, findByName, create, update, remove, PACKAGING_SIZES };
