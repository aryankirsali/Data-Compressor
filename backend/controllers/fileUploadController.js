const FileLog = require("../models/fileLog");
const { sendToKafka } = require("../services/kafkaProducer");
const { logInfo, logError } = require("../utils/logger");
const _ = require("lodash");

const uploadFile = async (req, res, next) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded." });
  }

  try {
    // For each file, send to Kafka for compression
    for (let file of files) {
      const { filename, path, size } = file;

      // Create a log entry for the upload attempt
      const fileLog = new FileLog({
        filename,
        status: "success",
        size,
      });

      await fileLog.save(); // Save the initial upload attempt log

      // Send to Kafka
      await sendToKafka({
        type: "compression",
        filename,
        path,
        size,
      });

      // Log success using Winston
      logInfo("File uploaded and processing started", { filename, size });
    }

    res.status(200).json({
      message: "Files uploaded successfully and processing started.",
    });
  } catch (error) {
    // Handle errors and log them in MongoDB and Winston
    const fileLog = new FileLog({
      filename: req.files[0].originalname,
      status: "failure",
      errorMessage: error.message,
    });

    await fileLog.save();
    logError("File upload failed", { error: error.message });

    next(error);
  }
};

module.exports = { uploadFile };
