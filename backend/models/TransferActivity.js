const mongoose = require("mongoose");

const transferActivitySchema = new mongoose.Schema({
  tokenId: { type: String, required: true, index: true },
  from: String,
  to: String,
  location: String,
  notes: String,
  timestamp: Number,
  role: String,
  txHash: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TransferActivity", transferActivitySchema);
