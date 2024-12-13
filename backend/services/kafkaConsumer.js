const { Kafka } = require("kafkajs");
const { compressFile, getDownloadUrlFromS3 } = require("./fileService");
const { logInfo, logError } = require("../utils/logger");
const FileLog = require("../models/fileLog");

const kafka = new Kafka({
  clientId: "file-compressor",
  brokers: ["localhost:9092"], // Ensure your Kafka broker URL is correct
});

const consumer = kafka.consumer({ groupId: "file-processor-group" });

const startKafkaConsumer = async (broadcast) => {
  await consumer.connect();
  await consumer.subscribe({ topic: "file-compression", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { filename, path, size } = JSON.parse(message.value.toString());
      logInfo("Received message for compression", { filename, size });

      try {
        // Compress the file
        const { s3FileUrl, compressedSize } = await compressFile(
          path,
          filename
        );

        // Log the successful compression and upload in MongoDB
        const fileLog = new FileLog({
          filename,
          status: "success",
          size,
          compressedSize, // Store the compressed size
          errorMessage: null,
          downloadUrl: s3FileUrl,
        });
        await fileLog.save();

        // Broadcast success to WebSocket clients with compressed size
        broadcast({
          filename,
          status: "success",
          url: s3FileUrl,
          compressedSize, // Send compressed size
        });

        logInfo("File processed and uploaded to S3", { filename, s3FileUrl });
      } catch (error) {
        // Log failure in MongoDB
        const fileLog = new FileLog({
          filename,
          status: "failure",
          size,
          errorMessage: error.message,
        });
        await fileLog.save();

        // Broadcast failure to WebSocket clients
        broadcast({
          filename,
          status: "failed",
          error: error.message,
        });

        logError("File processing failed", { filename, error: error.message });
      }
    },
  });
};

module.exports = { startKafkaConsumer };
