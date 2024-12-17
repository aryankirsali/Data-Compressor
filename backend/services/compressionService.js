const fs = require("fs").promises; // Use fs.promises for async operations
const zstd = require("@mongodb-js/zstd"); // Zstandard library
const { logInfo, logError } = require("../utils/logger");

/**
 * Compress a file using Zstandard for maximum compression ratio
 */
const compress = async (filePath) => {
  try {
    // Check if the file exists
    await fs.access(filePath);

    // Read file asynchronously
    const data = await fs.readFile(filePath);

    // Compress the file using Zstandard (asynchronous)
    const compressedData = await zstd.compress(data);

    // Define the compressed file path
    const compressedPath = `${filePath}.zst`;

    // Write compressed data
    await fs.writeFile(compressedPath, compressedData);
    logInfo(`File compressed successfully: ${compressedPath}`);

    // Get the compressed file size
    const compressedSize = (await fs.stat(compressedPath)).size;
    return { compressedPath, compressedSize };
  } catch (error) {
    logError("Error during compression:", error.message);
    throw error;
  }
};

/**
 * Decompress a Zstandard-compressed file
 */
const decompress = async (compressedPath) => {
  try {
    // Check if the compressed file exists
    await fs.access(compressedPath);

    // Read compressed file
    const compressedData = await fs.readFile(compressedPath);

    // Decompress the file using Zstandard (asynchronous)
    const decompressedData = await zstd.decompress(compressedData);

    // Define the decompressed file path
    const originalPath = compressedPath.replace(".zst", "");

    // Write decompressed data
    await fs.writeFile(originalPath, decompressedData);
    logInfo(`File decompressed successfully: ${originalPath}`);

    return originalPath;
  } catch (error) {
    logError("Error during decompression:", error.message);
    throw error;
  }
};

module.exports = { compress, decompress };
