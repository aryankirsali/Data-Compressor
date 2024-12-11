const mongoose = require("mongoose");

const fileLogSchema = new mongoose.Schema({
  filename: String,
  status: { type: String, enum: ["success", "failure"], required: true },
  size: Number,
  errorMessage: String,
  timestamp: { type: Date, default: Date.now },
});

const FileLog = mongoose.model("FileLog", fileLogSchema);

module.exports = FileLog;
