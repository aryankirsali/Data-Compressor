const express = require("express");
const {
  compressFile,
  getDownloadUrlFromS3,
} = require("../services/fileService");
const multer = require("multer");
const { logInfo, logError } = require("../utils/logger");

const router = express.Router();

// Set up file upload middleware using multer
const upload = multer({ dest: "uploads/" });

// Route to handle file upload, compression, and S3 upload
router.post("/upload", upload.array("files", 5), async (req, res) => {
  console.log("API hit: /upload");
  console.log("Files received:", req.files);

  const files = req.files;
  const result = []; // Store the results to return in the response

  try {
    // Process each file (compress and upload to S3)
    for (let file of files) {
      try {
        // Compress and upload each file to S3
        await compressFile(file.path, file.originalname);

        // Get the download URL from S3
        const downloadUrl = await getDownloadUrlFromS3(file.originalname);

        // Store the result for this file
        result.push({
          filename: file.originalname,
          compressedUrl: downloadUrl, // URL to the compressed file on S3
        });
      } catch (error) {
        // If an error occurs, store the error message for this file
        result.push({
          filename: file.originalname,
          error: error.message, // Send the error message if compression/upload fails
        });
      }
    }

    // Send the result back with the filenames and their respective compressed URLs or errors
    res.status(200).send({ message: "Files processed", files: result });
  } catch (error) {
    logError("File upload failed", { error: error.message });
    res.status(500).send({
      message: "Error in file upload and compression",
      error: error.message,
    });
  }
});

// Route to handle file download (getting the pre-signed URL from S3)
router.get("/download/:filename", async (req, res) => {
  const { filename } = req.params;
  try {
    console.log("API hit: /download");
    console.log("File received:", filename);

    // Get the download URL from S3 for the file
    const downloadUrl = await getDownloadUrlFromS3(filename);

    res.status(200).send({ downloadUrl });
  } catch (error) {
    logError("Error fetching download URL", { filename, error: error.message });
    res.status(500).send({
      message: "Error fetching download URL",
      error: error.message,
    });
  }
});

module.exports = router;
