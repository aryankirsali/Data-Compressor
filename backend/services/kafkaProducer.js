const { Kafka } = require("kafkajs");
const { logInfo, logError } = require("../utils/logger");

const kafka = new Kafka({
  clientId: "file-compressor",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

const initializeKafkaProducer = async () => {
  await producer.connect();
  logInfo("Kafka Producer connected");
};

const sendToKafka = async (message) => {
  try {
    await producer.send({
      topic: "file-compression",
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
    logInfo("Message sent to Kafka", { message });
  } catch (error) {
    logError("Error sending message to Kafka", { error: error.message });
  }
};

module.exports = { initializeKafkaProducer, sendToKafka };
