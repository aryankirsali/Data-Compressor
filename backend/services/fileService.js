const AWS = require("aws-sdk");
const fs = require("fs").promises; // Async file operations
const { compress } = require("./compressionService");

// AWS SDK configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Function to format file size
const formatSize = (size) => {
  if (size < 1024) return `${size} bytes`;
  if (size < 1048576) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1048576).toFixed(2)} MB`;
};

/**
 * Compress and upload a file to S3
 */
const compressFile = async (filePath, filename) => {
  try {
    // Get the original file size
    const originalSize = (await fs.stat(filePath)).size;

    // Compress the file
    const { compressedPath, compressedSize } = await compress(filePath);

    // Upload the compressed file to S3
    const s3FileUrl = await uploadToS3(compressedPath, `${filename}.zst`);
    console.log(`File uploaded to S3: ${s3FileUrl}`);

    return {
      s3FileUrl,
      originalSize: formatSize(originalSize),
      compressedSize: formatSize(compressedSize),
    };
  } catch (error) {
    console.error("Error during file compression and upload:", error.message);
    throw error;
  }
};

/**
 * Upload a file to S3
 */
const uploadToS3 = async (filePath, filename) => {
  const fileBuffer = await fs.readFile(filePath);
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `uploads/${filename}`,
    Body: fileBuffer,
    ContentType: "application/zstd", // Correct MIME type for Zstandard files
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error("Error uploading to S3:", error.message);
    throw new Error("Error uploading file to S3");
  }
};

const getDownloadUrlFromS3 = async (filename) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `uploads/${filename}`,
    Expires: 60,
  };

  try {
    const url = await s3.getSignedUrlPromise("getObject", params);
    return url;
  } catch (error) {
    console.error("Error generating S3 download URL:", error.message);
    throw error;
  }
};

module.exports = { compressFile, getDownloadUrlFromS3 };
