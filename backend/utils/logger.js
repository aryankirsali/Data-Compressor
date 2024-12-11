const winston = require("winston");

let logger;

const initializeLogger = () => {
  logger = winston.createLogger({
    level: "info",
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({ filename: "logs/app.log" }),
    ],
  });
};

const logInfo = (message, metadata = {}) => {
  logger.info(message, metadata);
};

const logError = (message, metadata = {}) => {
  logger.error(message, metadata);
};

module.exports = { initializeLogger, logInfo, logError };
