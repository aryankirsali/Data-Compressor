const zlib = require("zlib");
const fs = require("fs").promises; // Use fs.promises for async operations
const util = require("util");
const { logInfo, logError } = require("../utils/logger");

const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

const compress = async (filePath) => {
  try {
    // Check if the file exists
    await fs.access(filePath); // Throws error if file doesn't exist

    // Read file asynchronously
    const data = await fs.readFile(filePath);
    const compressed = await gzip(data);

    // Define the compressed file path
    const compressedPath = `${filePath}.gz`;

    // Write compressed data asynchronously
    await fs.writeFile(compressedPath, compressed);
    logInfo(`File compressed: ${compressedPath}`);

    // Return the compressed file size
    const compressedSize = (await fs.stat(compressedPath)).size;
    return { compressedPath, compressedSize }; // Return both path and size
  } catch (error) {
    logError("Error during compression:", error.message);
    throw error;
  }
};

const decompress = async (compressedPath) => {
  try {
    // Check if the compressed file exists
    await fs.access(compressedPath); // Throws error if file doesn't exist

    // Read compressed file asynchronously
    const data = await fs.readFile(compressedPath);
    const decompressed = await gunzip(data);

    // Define the original file path
    const originalPath = compressedPath.replace(".gz", "");

    // Write decompressed data asynchronously
    await fs.writeFile(originalPath, decompressed);
    logInfo(`File decompressed: ${originalPath}`);

    return originalPath;
  } catch (error) {
    logError("Error during decompression:", error.message);
    throw error;
  }
};

module.exports = { compress, decompress };
