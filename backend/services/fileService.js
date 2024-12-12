const AWS = require("aws-sdk");
const fs = require("fs");
const zlib = require("zlib");

// Manually configure AWS SDK with access keys and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // Use your region
});

const s3 = new AWS.S3();

// Function to compress the file
const compressFile = async (filePath, filename) => {
  try {
    const fileBuffer = fs.readFileSync(filePath); // Read file from the given path

    // Compress the file (using gzip in this example)
    const compressedBuffer = await compressBuffer(fileBuffer);

    // Upload the compressed file to S3
    const s3FileUrl = await uploadToS3(compressedBuffer, filename);
    console.log(`File uploaded to S3: ${s3FileUrl}`);
  } catch (error) {
    console.error("Error in file compression and upload:", error.message);
    throw error; // Propagate the error
  }
};

// Compress the buffer (using gzip as an example)
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

// Upload the file buffer to S3
const uploadToS3 = async (fileBuffer, filename) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // Replace with your S3 bucket name
    Key: `uploads/${filename}`, // File path in the S3 bucket
    Body: fileBuffer, // File content as buffer
    ContentType: "application/pdf", // Set the file type (e.g., 'application/pdf')
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
