// ---------------------------------------------------------------
// models/supplierModel.js
// ALL supplier SQL lives here. Controllers never write SQL directly,
// which keeps routes/controllers thin and easy to read.
// Every query uses ? placeholders (parameterised) so SQL injection is
// impossible.
// ---------------------------------------------------------------
const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(
    `SELECT s.supplier_id, s.business_name, s.contact_person, s.phone,
            s.province, s.address, s.created_at,
            COUNT(p.purchase_id) AS purchase_count,
            COALESCE(SUM(p.total_amount), 0) AS total_spent
     FROM suppliers s
     LEFT JOIN purchases p ON p.supplier_id = s.supplier_id
     GROUP BY s.supplier_id, s.business_name, s.contact_person,
              s.phone, s.province, s.address, s.created_at
     ORDER BY s.business_name`
  );
  return rows;
}

async function findById(supplierId) {
  const [rows] = await pool.query(
    'SELECT * FROM suppliers WHERE supplier_id = ?',
    [supplierId]
  );
  return rows[0] || null;
}

async function create(supplier) {
  const [result] = await pool.query(
    `INSERT INTO suppliers (business_name, contact_person, phone, province, address)
     VALUES (?, ?, ?, ?, ?)`,
    [supplier.business_name, supplier.contact_person, supplier.phone, supplier.province, supplier.address]
  );
  return findById(result.insertId);
}

async function update(supplierId, supplier) {
  await pool.query(
    `UPDATE suppliers
        SET business_name = ?, contact_person = ?, phone = ?, province = ?, address = ?
      WHERE supplier_id = ?`,
    [supplier.business_name, supplier.contact_person, supplier.phone,
     supplier.province, supplier.address, supplierId]
  );
  return findById(supplierId);
}

async function remove(supplierId) {
  const [result] = await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [supplierId]);
  return result.affectedRows > 0;
}

/** How many purchases link to this supplier? Used before deleting. */
async function countPurchases(supplierId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM purchases WHERE supplier_id = ?',
    [supplierId]
  );
  return rows[0].total;
}

module.exports = { findAll, findById, create, update, remove, countPurchases };
