// ---------------------------------------------------------------
// middleware/errors.js
// 1. asyncHandler  -> lets us use async functions in routes without
//                     writing try/catch in every single route.
// 2. ApiError      -> a small error class carrying an HTTP status code.
// 3. notFound      -> 404 for unknown URLs.
// 4. errorHandler  -> the ONE central place that sends error responses.
// ---------------------------------------------------------------

/**
 * Wrap an async controller so any thrown error goes to next(error).
 * Example: router.get('/', asyncHandler(controller.getAll))
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create an error with an HTTP status code.
 * new ApiError(400, 'Quantity must be greater than zero')
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details || null;
  }
}

/** Any URL that does not match a route. */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found: ' + req.method + ' ' + req.originalUrl,
  });
}

/**
 * Central error handler. Express recognises it because of the
 * four parameters (err, req, res, next).
 */
function errorHandler(err, req, res, next) {
  // If headers were already sent we must let Express close the connection.
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Unexpected server error';

  // ---- Translate common MySQL errors into friendly messages ----
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'That record already exists. Please check the name or phone number.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'The related record (supplier, vendor or fruit) does not exist.';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    message = 'This record is used by other records and cannot be deleted.';
  } else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.code === 'WARN_DATA_TRUNCATED') {
    statusCode = 400;
    message = 'The data you entered is not allowed by the database rules.';
  } else if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'PROTOCOL_CONNECTION_LOST' ||
    err.code === 'ER_ACCESS_DENIED_ERROR' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ENOTFOUND'
  ) {
    statusCode = 503;
    message = 'The database is currently unavailable. Please try again shortly.';
  }

  // Log the full error on the server only (never send stack traces to users).
  if (statusCode >= 500) {
    console.error('[SERVER ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    details: err.details || undefined,
  });
}

module.exports = { asyncHandler, ApiError, notFound, errorHandler };
