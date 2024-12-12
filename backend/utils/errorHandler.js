const { logError } = require("./logger");

/**
 * Error handling middleware
 * Logs the error and sends an appropriate response to the client.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error using Winston
  logError({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    status: err.status || 500,
  });

  // Send an appropriate response
  const statusCode = err.status || 500;
  const response = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack; // Include stack trace in development
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
