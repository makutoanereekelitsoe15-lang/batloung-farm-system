// ---------------------------------------------------------------
// models/vendorModel.js
// All vendor SQL, including the name / phone search used by the
// Vendors page and by the sale form.
// ---------------------------------------------------------------
const { pool } = require('../config/db');

async function findAll(search) {
  const term = (search || '').trim();

  if (term) {
    // LIKE with parameters -> safe search by name OR phone number.
    const like = '%' + term + '%';
    const [rows] = await pool.query(
      `SELECT v.*,
              (SELECT COUNT(*) FROM sales s WHERE s.vendor_id = v.vendor_id) AS sale_count,
              (SELECT COALESCE(SUM(s.outstanding_balance), 0) FROM sales s WHERE s.vendor_id = v.vendor_id) AS outstanding
         FROM vendors v
        WHERE v.vendor_name LIKE ? OR v.phone_number LIKE ? OR v.location LIKE ?
        ORDER BY v.vendor_name`,
      [like, like, like]
    );
    return rows;
  }

  const [rows] = await pool.query(
    `SELECT v.*,
            (SELECT COUNT(*) FROM sales s WHERE s.vendor_id = v.vendor_id) AS sale_count,
            (SELECT COALESCE(SUM(s.outstanding_balance), 0) FROM sales s WHERE s.vendor_id = v.vendor_id) AS outstanding
       FROM vendors v
      ORDER BY v.vendor_name`
  );
  return rows;
}

async function findById(vendorId) {
  const [rows] = await pool.query('SELECT * FROM vendors WHERE vendor_id = ?', [vendorId]);
  return rows[0] || null;
}

async function create(vendor) {
  const [result] = await pool.query(
    'INSERT INTO vendors (vendor_name, phone_number, location, registration_date) VALUES (?, ?, ?, ?)',
    [vendor.vendor_name, vendor.phone_number, vendor.location, vendor.registration_date]
  );
  return findById(result.insertId);
}

async function update(vendorId, vendor) {
  await pool.query(
    'UPDATE vendors SET vendor_name = ?, phone_number = ?, location = ? WHERE vendor_id = ?',
    [vendor.vendor_name, vendor.phone_number, vendor.location, vendorId]
  );
  return findById(vendorId);
}

/** Used before deleting a vendor (not exposed in the UI, kept for completeness). */
async function countSales(vendorId) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM sales WHERE vendor_id = ?', [vendorId]);
  return rows[0].total;
}

module.exports = { findAll, findById, create, update, countSales };
