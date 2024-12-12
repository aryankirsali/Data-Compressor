require("dotenv").config();
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const fileUploadRoute = require("./routes/fileRoutes");
const errorHandler = require("./utils/errorHandler");
const mongoose = require("mongoose");
const { initializeKafkaProducer } = require("./services/kafkaProducer");
const { startKafkaConsumer } = require("./services/kafkaConsumer");
const { initializeLogger, logInfo, logError } = require("./utils/logger");

const app = express();
app.use(cors());
const port = process.env.PORT || 3001;

// Initialize Logger (Winston)
initializeLogger();

// Validate essential environment variables
if (!process.env.MONGO_URI) {
  logError("MONGO_URI is not defined. Exiting...");
  process.exit(1);
}

// Initialize MongoDB
mongoose.set("strictQuery", false); // Optional: Suppresses warnings for strict queries
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logInfo("MongoDB connected successfully"))
  .catch((err) => {
    logError("MongoDB connection error:", { error: err });
    process.exit(1);
  });

// Middlewares
app.use(bodyParser.json());

// Optionally handle CORS if needed
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Routes
app.use("/api/files", fileUploadRoute);

// Error handling middleware
app.use(errorHandler);

// Initialize Kafka Producer and Consumer
try {
  initializeKafkaProducer();
  startKafkaConsumer();
  logInfo("Kafka producer and consumer initialized successfully");
} catch (error) {
  logError("Error initializing Kafka services:", { error });
  process.exit(1); // Exit if Kafka initialization fails
}

// Start the server
app.listen(port, () => {
  logInfo(`Server running on port ${port}`);
});
