const { Kafka } = require("kafkajs");
const { compressFile } = require("./fileService");
const { logInfo, logError } = require("../utils/logger");

const kafka = new Kafka({
  clientId: "file-compressor",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "file-processor-group" });

const startKafkaConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "file-compression", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { filename, path, size } = JSON.parse(message.value.toString());
      logInfo("Message received from Kafka for compression", {
        filename,
        size,
      });
      try {
        await compressFile(path, filename);
      } catch (error) {
        logError("Error during compression", {
          filename,
          error: error.message,
        });
      }
    },
  });
};

module.exports = { startKafkaConsumer };
