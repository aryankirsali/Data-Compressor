const { Kafka } = require("kafkajs");
const { logInfo, logError } = require("../utils/logger");

const kafka = new Kafka({
  clientId: "file-compressor",
  brokers: ["localhost:9092"], // Make sure this matches your Kafka broker setup
});

const producer = kafka.producer();

const initializeKafkaProducer = async () => {
  await producer.connect();
  logInfo("Kafka Producer connected");
};

const sendToKafka = async (message) => {
  try {
    // Ensure the topic name is correct
    const topic = "file-compression"; // Example topic
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
    logInfo("Message sent to Kafka", { message: JSON.stringify(message) });
  } catch (error) {
    logError("Error sending message to Kafka", { error: error.message });
    throw new Error("Error sending message to Kafka");
  }
};

module.exports = { initializeKafkaProducer, sendToKafka };
