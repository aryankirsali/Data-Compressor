const express = require("express");
const multer = require("multer");
const { sendToKafka } = require("../services/kafkaProducer");
const { logInfo, logError } = require("../utils/logger");

const router = express.Router();

// Set up file upload middleware using multer
const upload = multer({ dest: "uploads/" });

// Route to handle file upload, compression, and S3 upload
router.post("/upload", upload.array("files", 100), async (req, res) => {
  console.log("API hit: /upload");
  const files = req.files;

  try {
    for (const file of files) {
      // Ensure the path is correct
      const { originalname: filename, path, size } = file;

      // Log the file path and check if it's valid
      console.log("File Path:", path); // Debugging: Check if path is correct

      if (!path) {
        throw new Error(`Missing file path for ${filename}`);
      }

      // Send file metadata to Kafka
      await sendToKafka({
        filename,
        path,
        size,
      });
    }

    res.status(200).send({ message: "Files are being processed" });
  } catch (error) {
    console.error("Error publishing messages to Kafka:", error.message);
    res.status(500).send({ message: "Failed to start file processing" });
  }
});

module.exports = router;
