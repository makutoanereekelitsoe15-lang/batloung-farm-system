// ---------------------------------------------------------------
// controllers/supplierController.js
// Reads the request -> validates -> calls the model -> sends a reply.
// No SQL is written here.
// ---------------------------------------------------------------
const supplierModel = require('../models/supplierModel');
const { ApiError } = require('../middleware/errors');
const v = require('../utils/validate');

/** Check the supplier fields coming from the form. */
function readSupplierBody(body) {
  const province = v.cleanText(body.province);
  if (!v.PROVINCES.includes(province)) {
    throw new ApiError(400, 'Province must be one of the nine South African provinces.');
  }

  return {
    business_name: v.requiredText(body.business_name, 'Business name', 3),
    contact_person: v.requiredText(body.contact_person, 'Contact person', 2),
    phone: v.requiredPhone(body.phone, 'Phone number'),
    province: province,
    address: v.requiredText(body.address, 'Address', 5),
  };
}

// GET /api/suppliers
exports.getAll = async function (req, res) {
  const suppliers = await supplierModel.findAll();
  res.json({ success: true, count: suppliers.length, data: suppliers });
};

// GET /api/suppliers/:id
exports.getOne = async function (req, res) {
  const id = v.parseId(req.params.id, 'Supplier ID');
  const supplier = await supplierModel.findById(id);
  if (!supplier) throw new ApiError(404, 'Supplier ' + id + ' was not found.');
  res.json({ success: true, data: supplier });
};

// POST /api/suppliers
exports.create = async function (req, res) {
  const supplier = readSupplierBody(req.body);
  const created = await supplierModel.create(supplier);
  res.status(201).json({ success: true, message: 'Supplier registered successfully.', data: created });
};

// PUT /api/suppliers/:id
exports.update = async function (req, res) {
  const id = v.parseId(req.params.id, 'Supplier ID');
  const existing = await supplierModel.findById(id);
  if (!existing) throw new ApiError(404, 'Supplier ' + id + ' was not found.');

  const supplier = readSupplierBody(req.body);
  const updated = await supplierModel.update(id, supplier);
  res.json({ success: true, message: 'Supplier updated successfully.', data: updated });
};

// DELETE /api/suppliers/:id
exports.remove = async function (req, res) {
  const id = v.parseId(req.params.id, 'Supplier ID');
  const existing = await supplierModel.findById(id);
  if (!existing) throw new ApiError(404, 'Supplier ' + id + ' was not found.');

  // Business rule: a supplier that already delivered stock cannot be deleted,
  // otherwise the purchase history would lose its owner.
  const purchases = await supplierModel.countPurchases(id);
  if (purchases > 0) {
    throw new ApiError(
      409,
      'Cannot delete this supplier: ' + purchases + ' purchase(s) are linked to it. ' +
      'Keep the record for history, or delete those purchases first.'
    );
  }

  await supplierModel.remove(id);
  res.json({ success: true, message: 'Supplier deleted successfully.' });
};
