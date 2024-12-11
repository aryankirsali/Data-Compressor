const express = require("express");
const bodyParser = require("body-parser");
const fileUploadRoute = require("./routes/uploadRoute");
const errorHandler = require("./utils/errorHandler");
const mongoose = require("mongoose");
const { initializeKafkaProducer } = require("./services/kafkaProducer");
const { startKafkaConsumer } = require("./services/kafkaConsumer");
const { initializeLogger } = require("./utils/logger");

const app = express();
const port = process.env.PORT || 3001;

// Initialize MongoDB
mongoose
  .connect("mongodb://localhost:27017/file_compressor", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Initialize Logger (Winston)
initializeLogger();

// Middlewares
app.use(bodyParser.json());

// Routes
app.use("/upload", fileUploadRoute);

// Error handling middleware
app.use(errorHandler);

// Initialize Kafka Producer and Consumer
initializeKafkaProducer();
startKafkaConsumer();

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
