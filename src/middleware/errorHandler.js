const { error } = require("../utils/logger.util");

function errorHandler(err, req, res, next) {
  error(err.stack || err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { error: err.stack }),
  });
}

module.exports = { errorHandler };
