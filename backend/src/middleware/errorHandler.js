const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    error: err.message
  });

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || (err.message === 'Not allowed by CORS' ? 403 : 500);
  const response = {
    status: 'error',
    message: status === 500 ? 'Internal server error' : err.message
  };

  return res.status(status).json(response);
}

module.exports = errorHandler;
