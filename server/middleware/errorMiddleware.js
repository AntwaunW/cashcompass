// A small, lightweight safety net that sits at the very end of the middleware
// chain in index.js. It does NOT replace the try/catch blocks already inside
// each controller — those still handle their own errors. This just catches
// anything that slips past them: unmatched routes, and any error that
// reaches Express without already having a response sent.

// Runs when no route matched the request at all (e.g. a typo'd URL)
const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
};

// Express's generic error handler — must be declared with all 4 arguments
// (err, req, res, next) or Express won't recognize it as an error handler.
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  // If a controller already set a non-200 status before throwing, keep it;
  // otherwise default to 500 (unexpected server error).
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({ message: err.message || 'Server error' });
};

module.exports = { notFound, errorHandler };
