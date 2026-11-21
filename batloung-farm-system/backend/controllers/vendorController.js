// ---------------------------------------------------------------
// controllers/vendorController.js
// Vendor registration, listing, search (name or phone) and updating.
// ---------------------------------------------------------------
const vendorModel = require('../models/vendorModel');
const { ApiError } = require('../middleware/errors');
const v = require('../utils/validate');

function readVendorBody(body, isUpdate) {
  const vendor = {
    vendor_name: v.requiredText(body.vendor_name, 'Vendor name', 2),
    phone_number: v.requiredPhone(body.phone_number, 'Phone number'),
    location: v.requiredText(body.location, 'Location', 2),
  };

  if (!isUpdate) {
    // Registration date is optional: use today when the user leaves it blank.
    const today = new Date().toISOString().slice(0, 10);
    const date = body.registration_date ? v.isoDate(body.registration_date, 'Registration date') : today;
    if (date > today) {
      throw new ApiError(400, 'Registration date cannot be in the future.');
    }
    vendor.registration_date = date;
  }

  return vendor;
}

// GET /api/vendors?search=thabo
exports.getAll = async function (req, res) {
  const search = req.query.search ? v.cleanText(req.query.search) : '';
  const vendors = await vendorModel.findAll(search);
  res.json({ success: true, count: vendors.length, search: search || null, data: vendors });
};

// GET /api/vendors/:id
exports.getOne = async function (req, res) {
  const id = v.parseId(req.params.id, 'Vendor ID');
  const vendor = await vendorModel.findById(id);
  if (!vendor) throw new ApiError(404, 'Vendor ' + id + ' was not found.');
  res.json({ success: true, data: vendor });
};

// POST /api/vendors
exports.create = async function (req, res) {
  const vendor = readVendorBody(req.body, false);
  const created = await vendorModel.create(vendor);
  res.status(201).json({ success: true, message: 'Vendor registered successfully.', data: created });
};

// PUT /api/vendors/:id
exports.update = async function (req, res) {
  const id = v.parseId(req.params.id, 'Vendor ID');
  const existing = await vendorModel.findById(id);
  if (!existing) throw new ApiError(404, 'Vendor ' + id + ' was not found.');

  const vendor = readVendorBody(req.body, true);
  const updated = await vendorModel.update(id, vendor);
  res.json({ success: true, message: 'Vendor updated successfully.', data: updated });
};
