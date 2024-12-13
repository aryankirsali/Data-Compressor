const AWS = require("aws-sdk");
const fs = require("fs").promises; // Use fs.promises for async operations
const zlib = require("zlib");

// Manually configure AWS SDK with access keys and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // Use your region
});

const s3 = new AWS.S3();

// Function to convert bytes to a human-readable format (KB, MB)
const formatSize = (size) => {
  if (size < 1024) return `${size} bytes`;
  if (size < 1048576) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1048576).toFixed(2)} MB`;
};

// Function to compress the file
const compressFile = async (filePath, filename) => {
  try {
    // Get original file size
    const originalSize = (await fs.stat(filePath)).size;

    // Compress the file (using gzip in this example)
    const { compressedPath, compressedSize } = await compress(filePath);

    // Upload the compressed file to S3 and get the download URL
    const s3FileUrl = await uploadToS3(compressedPath, filename);
    console.log(`File uploaded to S3: ${s3FileUrl}`);

    // Return the download URL, original size, and compressed size
    return {
      s3FileUrl,
      originalSize: formatSize(originalSize),
      compressedSize: formatSize(compressedSize), // Only include compressed size once it's processed
    };
  } catch (error) {
    console.error("Error in file compression and upload:", error.message);
    throw error; // Propagate the error
  }
};

// Compress the buffer (using gzip in this example)
const compressBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const gzip = zlib.createGzip();
    const compressedBuffer = [];
    gzip.on("data", (chunk) => compressedBuffer.push(chunk));
    gzip.on("end", () => resolve(Buffer.concat(compressedBuffer)));
    gzip.on("error", reject);

    gzip.end(buffer); // Start compression
  });
};

// Compress the file and return the compressed file path and size
const compress = async (filePath) => {
  try {
    // Check if the file exists
    await fs.access(filePath); // Throws error if file doesn't exist

    // Read file asynchronously
    const data = await fs.readFile(filePath);

    // Compress the file buffer using gzip
    const compressedBuffer = await compressBuffer(data);

    // Define the compressed file path
    const compressedPath = `${filePath}.gz`;

    // Write compressed data asynchronously
    await fs.writeFile(compressedPath, compressedBuffer);

    console.log(`File compressed: ${compressedPath}`);

    // Get the size of the compressed file
    const compressedSize = (await fs.stat(compressedPath)).size;

    // Return both compressed file path and size
    return { compressedPath, compressedSize };
  } catch (error) {
    console.error("Error during compression:", error.message);
    throw error;
  }
};

// Upload the file buffer to S3
const uploadToS3 = async (filePath, filename) => {
  const fileBuffer = await fs.readFile(filePath); // Read compressed file buffer
  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // Replace with your S3 bucket name
    Key: `uploads/${filename}`, // File path in the S3 bucket
    Body: fileBuffer, // File content as buffer
    ContentType: "application/gzip", // Set the correct MIME type for compressed files
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location; // Return the file URL in S3
  } catch (error) {
    console.error("Error uploading file to S3:", error.message);
    throw new Error("Error uploading file to S3");
  }
};

// Get a pre-signed URL for downloading the file from S3
const getDownloadUrlFromS3 = async (filename) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // Replace with your S3 bucket name
    Key: `uploads/${filename}`, // File path in the S3 bucket
    Expires: 60, // URL expiration time in seconds
  };

  try {
    const url = await s3.getSignedUrlPromise("getObject", params);
    return url; // Return the pre-signed URL
  } catch (error) {
    console.error("Error getting download URL from S3:", error.message);
    throw error;
  }
};

module.exports = {
  compressFile,
  getDownloadUrlFromS3,
};
