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

// Route to handle file upload and compression
router.post("/upload", upload.array("files", 5), async (req, res) => {
  const files = req.files;

  try {
    for (let file of files) {
      // Process each file (compress and upload to S3)
      await compressFile(file.path, file.originalname);
    }
    res
      .status(200)
      .send({ message: "Files compressed and uploaded successfully" });
  } catch (error) {
    logError("File upload failed", { error: error.message });
    res
      .status(500)
      .send({
        message: "Error in file upload and compression",
        error: error.message,
      });
  }
});

// Route to handle file download (getting the pre-signed URL)
router.get("/download/:filename", async (req, res) => {
  const { filename } = req.params;

  try {
    const downloadUrl = await getDownloadUrlFromS3(filename);
    res.status(200).send({ downloadUrl });
  } catch (error) {
    logError("Error fetching download URL", { filename, error: error.message });
    res
      .status(500)
      .send({ message: "Error fetching download URL", error: error.message });
  }
});

module.exports = router;
