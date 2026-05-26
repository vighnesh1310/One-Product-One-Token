const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  payerAddress: { type: String, required: true },
  payeeAddress: { type: String, required: true },
  amountWei: { type: String, required: true },
  currency: { type: String, default: "ETH" },
  txHash: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", PaymentSchema);
