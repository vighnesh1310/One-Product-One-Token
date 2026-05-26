const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  tokenId: { type: String, required: true },
  seller: { type: String, required: true },
  buyer: { type: String, required: true },
  priceWei: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model("Order", OrderSchema);
