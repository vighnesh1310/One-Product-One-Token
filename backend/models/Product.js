const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  batchNumber: { type: String, required: true },
  manufacturerName: { type: String, required: true },
  manufacturerLocation: { type: String, required: true },
  harvestDate: { type: Date },
  currentOwner: { type: String },
  isAuthentic: { type: Boolean, default: true },
  riskScore: { type: Number, default: 0 },
  riskFlags: [String],
  qrCode: { type: String },
  isForSale: { type: Boolean, default: false },
  priceWei: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Product", productSchema);
