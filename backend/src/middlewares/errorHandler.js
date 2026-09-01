/**
 * Centralized Application Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Application Error]:', err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Handle Prisma Known Request Errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Conflict: A resource with this unique constraint already exists.',
      details: err.meta,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found or record does not exist.',
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = {
  errorHandler,
};
