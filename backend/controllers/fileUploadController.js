const FileLog = require("../models/fileLog");
const { sendToKafka } = require("../services/kafkaProducer");
const { logInfo, logError } = require("../utils/logger");

const uploadFile = async (req, res, next) => {
  const files = req.files;

  // Check if files are provided
  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded." });
  }

  try {
    const uploadPromises = files.map(async (file) => {
      const { originalname: filename, path, size } = file;

      // Create a log entry for the upload attempt
      const fileLog = new FileLog({
        filename,
        status: "processing", // Initial status set to "processing"
        size,
      });

      await fileLog.save(); // Save the log entry

      // Send file metadata to Kafka
      await sendToKafka({
        type: "compression",
        filename,
        path,
        size,
      });

      // Log success using Winston
      logInfo("File uploaded and processing started", { filename, size });
    });

    // Await all upload promises
    await Promise.all(uploadPromises);

    // Respond with success message
    res.status(200).json({
      message: "Files uploaded successfully and processing started.",
    });
  } catch (error) {
    // Log error details for each failed file
    logError("Error during file upload", { error: error.message });

    // Log error in MongoDB for each file
    const failedLogs = files.map((file) => ({
      filename: file.originalname,
      status: "failure",
      errorMessage: error.message,
    }));

    await FileLog.insertMany(failedLogs);

    // Pass the error to the error handler middleware
    next(error);
  }
};

module.exports = { uploadFile };
