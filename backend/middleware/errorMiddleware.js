const errorHandler = (err, req, res, next) => {
  console.error('Express Error Handler:', err.stack || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Custom response structure for different types of errors
  res.status(statusCode).json({
    message: err.message || 'An unexpected server error occurred',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

module.exports = { errorHandler, notFound };
