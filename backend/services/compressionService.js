const zlib = require("zlib");
const fs = require("fs");
const util = require("util");
const logger = require("../utils/logger");

const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

const compress = async (filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const compressed = await gzip(data);
    const compressedPath = `${filePath}.gz`;
    fs.writeFileSync(compressedPath, compressed);
    logger.info(`File compressed: ${compressedPath}`);
    return compressedPath;
  } catch (error) {
    logger.error("Error during compression:", error);
    throw error;
  }
};

const decompress = async (compressedPath) => {
  try {
    const data = fs.readFileSync(compressedPath);
    const decompressed = await gunzip(data);
    const originalPath = compressedPath.replace(".gz", "");
    fs.writeFileSync(originalPath, decompressed);
    logger.info(`File decompressed: ${originalPath}`);
    return originalPath;
  } catch (error) {
    logger.error("Error during decompression:", error);
    throw error;
  }
};

module.exports = { compress, decompress };
