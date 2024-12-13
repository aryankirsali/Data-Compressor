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
const WebSocket = require("ws");

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
mongoose.set("strictQuery", false);
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

// Routes
app.use("/api/files", fileUploadRoute);

// Error handling middleware
app.use(errorHandler);

// Initialize WebSocket Server
const wss = new WebSocket.Server({ noServer: true });
const connectedClients = new Set();

wss.on("connection", (ws) => {
  connectedClients.add(ws);
  ws.on("close", () => connectedClients.delete(ws));
});

const broadcast = (data) => {
  console.log("Broadcasting data to clients:", data);
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
};

// Initialize Kafka Producer and Consumer
try {
  initializeKafkaProducer();
  startKafkaConsumer(broadcast); // Pass the WebSocket broadcaster to the Kafka consumer
  logInfo("Kafka producer and consumer initialized successfully");
} catch (error) {
  logError("Error initializing Kafka services:", { error });
  process.exit(1);
}

// WebSocket CORS Configuration
app.server = app.listen(port, () => {
  logInfo(`Server running on port ${port}`);
});

app.server.on("upgrade", (request, socket, head) => {
  const origin = request.headers.origin;

  // Check if the request is coming from the frontend (port 3000)
  if (origin === "http://localhost:3000") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy(); // Reject connections from other origins
  }
});
