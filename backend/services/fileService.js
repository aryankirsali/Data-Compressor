const AWS = require("aws-sdk");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { logInfo, logError } = require("../utils/logger");
const FileLog = require("../models/FileLog");

// Set up AWS S3 instance
const s3 = new AWS.S3({
  region: "us-east-1", // Adjust to your region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Ensure to use environment variables for sensitive info
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Compress file (image or other types)
const compressFile = async (filePath, filename) => {
  const ext = path.extname(filename).toLowerCase();
  const outputPath = `/tmp/${filename}`;

  try {
    // Compress images (JPG, PNG, etc.) using sharp
    if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
      await sharp(filePath)
        .resize(800) // Resize to 800px width
        .toFormat("jpeg")
        .jpeg({ quality: 80 }) // Compression settings
        .toFile(outputPath);
    } else if (ext === ".pdf") {
      // Example compression logic for PDFs (could be expanded)
      const fileStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(outputPath);
      fileStream.pipe(writeStream);
    } else {
      throw new Error("Unsupported file type for compression");
    }

    // After compression, upload the file to S3
    await uploadToS3(outputPath, filename);
    logInfo("File compressed successfully", { filename });

    // Save the log entry for successful compression
    await saveFileLog(filename, "success", null);
  } catch (error) {
    logError("Compression failed", { filename, error: error.message });

    // Save the log entry for failed compression
    await saveFileLog(filename, "failure", error.message);
    throw error;
  }
};

// Function to upload compressed file to AWS S3
const uploadToS3 = async (filePath, filename) => {
  const fileContent = fs.readFileSync(filePath); // Read the compressed file
  const params = {
    Bucket: "compressor-file-storage", // Your S3 bucket name
    Key: `compressed/${filename}`, // S3 object key (path within the bucket)
    Body: fileContent, // File content
    ACL: "public-read", // Make the file publicly readable
  };

  try {
    // Upload file to S3
    const uploadResult = await s3.upload(params).promise();
    logInfo("File uploaded to S3", { filename, s3Url: uploadResult.Location });

    // Clean up local file after upload
    fs.unlinkSync(filePath);
  } catch (error) {
    logError("Error uploading file to S3", { filename, error: error.message });
    throw new Error("Error uploading file to S3");
  }
};

// Save success or failure logs into MongoDB
const saveFileLog = async (filename, status, errorMessage) => {
  const fileLog = new FileLog({
    filename,
    status,
    errorMessage,
  });

  await fileLog.save();
};

// Function to generate a pre-signed URL for downloading a file from S3
const getDownloadUrlFromS3 = async (filename) => {
  const params = {
    Bucket: 'compressor-file-storage', // Your S3 bucket name
    Key: `compressed/${filename}`, // S3 object key (path within the bucket)
    Expires: 60 * 60, // URL expiration time (1 hour)
  };

  try {
    // Generate a pre-signed URL
    const downloadUrl = await s3.getSignedUrlPromise('getObject', params);
    return downloadUrl;
  } catch (error) {
    logError('Error generating download URL from S3', { filename, error: error.message });
    throw new Error('Error generating download URL from S3');
  }
};

module.exports = { compressFile, uploadToS3, saveFileLog, getDownloadUrlFromS3 };

