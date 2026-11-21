// ---------------------------------------------------------------
// utils/validate.js
// Small helper functions used by the controllers to validate input
// BEFORE it reaches MySQL. The React forms check the same rules, but
// the server must never trust the browser.
// ---------------------------------------------------------------
const { ApiError } = require('../middleware/errors');

const PACKAGING_SIZES = ['SMALL', 'MEDIUM', 'LARGE'];
const PAYMENT_METHODS = ['CASH', 'MOBILE_MONEY', 'CREDIT'];
const PAYMENT_CHANNELS = ['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER'];
const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
];

/** Trim a value and make sure it is text. */
function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

/** Required text with a minimum length. */
function requiredText(value, label, minLength) {
  const text = cleanText(value);
  const min = minLength || 1;
  if (text.length < min) {
    throw new ApiError(400, label + ' is required (at least ' + min + ' characters).');
  }
  if (text.length > 255) {
    throw new ApiError(400, label + ' is too long (maximum 255 characters).');
  }
  return text;
}

/** Phone numbers: digits, spaces, brackets, plus and dash; 8-20 characters. */
function requiredPhone(value, label) {
  const phone = cleanText(value);
  if (!/^[0-9()+\- ]{8,20}$/.test(phone)) {
    throw new ApiError(400, label + ' must be a valid phone number (8-20 digits).');
  }
  return phone;
}

/** Positive whole number (used for IDs and quantities). */
function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(400, label + ' must be a whole number greater than zero.');
  }
  return number;
}

/** Positive amount with at most 2 decimals (used for money). */
function positiveMoney(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new ApiError(400, label + ' must be an amount greater than zero.');
  }
  if (Math.round(number * 100) !== Number((number * 100).toFixed(0))) {
    throw new ApiError(400, label + ' can have at most 2 decimal places.');
  }
  return Math.round(number * 100) / 100;
}

/** One of SMALL / MEDIUM / LARGE. */
function packagingSize(value) {
  const size = cleanText(value).toUpperCase();
  if (!PACKAGING_SIZES.includes(size)) {
    throw new ApiError(400, 'Packaging size must be SMALL, MEDIUM or LARGE.');
  }
  return size;
}

/** YYYY-MM-DD date string -> validated string. */
function isoDate(value, label) {
  const text = cleanText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) {
    throw new ApiError(400, label + ' must be a valid date in YYYY-MM-DD format.');
  }
  return text;
}

/** Reject phone numbers / IDs that come through as "null" or "undefined". */
function parseId(value, label) {
  return positiveInteger(value, label || 'ID');
}

module.exports = {
  PACKAGING_SIZES,
  PAYMENT_METHODS,
  PAYMENT_CHANNELS,
  PROVINCES,
  cleanText,
  requiredText,
  requiredPhone,
  positiveInteger,
  positiveMoney,
  packagingSize,
  isoDate,
  parseId,
};
