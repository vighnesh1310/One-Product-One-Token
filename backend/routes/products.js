const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const TransferActivity = require("../models/TransferActivity");
const web3Service = require("../middleware/web3Service");
const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

router.get("/", async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "transferactivities",
          localField: "tokenId",
          foreignField: "tokenId",
          as: "transferHistory"
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/stats/overview", async (req, res) => {
  try {
    const total = await Product.countDocuments();
    const authentic = await Product.countDocuments({ isAuthentic: true });
    const highRisk = await Product.countDocuments({ riskScore: { $gt: 70 } });
    const recent = await Product.find().sort({ createdAt: -1 }).limit(5);
    res.json({ success: true, stats: { total, authentic, flagged: total - authentic, highRisk }, recent });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/inventory/:address", async (req, res) => {
  try {
    const products = await Product.find({ currentOwner: req.params.address }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/market/forsale", async (req, res) => {
  try {
    const products = await Product.find({ isForSale: true }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:tokenId", async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { tokenId: req.params.tokenId } },
      {
        $lookup: {
          from: "transferactivities",
          localField: "tokenId",
          foreignField: "tokenId",
          as: "transferHistory"
        }
      }
    ]);
    if (!products.length) return res.status(404).json({ success: false, error: "Product not found" });
    const product = products[0];

    let blockchainData = null;
    try {
      const { isAuthentic, product: bcProduct } = await web3Service.verifyAuthenticity(req.params.tokenId);
      const history = await web3Service.getProductHistory(req.params.tokenId);
      blockchainData = { isAuthentic, product: bcProduct, history };
    } catch { }
    res.json({ success: true, product, blockchainData });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { productName, batchNumber, manufacturerName, manufacturerLocation, harvestDate, fromAddress } = req.body;
    if (!productName || !batchNumber || !manufacturerName || !manufacturerLocation || !fromAddress)
      return res.status(400).json({ success: false, error: "Missing required fields" });

    const { tokenId, txHash } = await web3Service.createProductToken(
      { productName, batchNumber, manufacturerName, manufacturerLocation, harvestDate }, fromAddress
    );

    // Clear any stale data for this tokenId (prevents duplicate key errors on local resets)
    await Product.deleteOne({ tokenId });
    await TransferActivity.deleteMany({ tokenId });

    const qrData = JSON.stringify({ tokenId, productName, batchNumber, manufacturerName });
    const qrCode = await QRCode.toDataURL(qrData);
    const product = new Product({
      tokenId, productName, batchNumber, manufacturerName, manufacturerLocation,
      harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
      currentOwner: fromAddress, isAuthentic: true, qrCode
    });
    await product.save();
    await TransferActivity.create({ tokenId, from: "0x0000000000000000000000000000000000000000", to: fromAddress, location: manufacturerLocation, notes: "Product created", timestamp: Date.now(), role: "Manufacturer", txHash });
    await product.save();
    res.status(201).json({ success: true, tokenId, txHash, product });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/:tokenId/transfer", async (req, res) => {
  try {
    const { toAddress, location, notes, fromAddress, recipientRole } = req.body;
    const { tokenId } = req.params;
    if (!toAddress || !location || !fromAddress || !recipientRole)
      return res.status(400).json({ success: false, error: "toAddress, location, fromAddress, and recipientRole required" });

    const { txHash } = await web3Service.transferOwnership(tokenId, toAddress, location, notes || "", recipientRole, fromAddress);

    let riskScore = 0, riskFlags = [];
    try {
      const history = await web3Service.getProductHistory(tokenId);
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        tokenId, transferHistory: history,
        newTransfer: { from: fromAddress, to: toAddress, location, timestamp: Date.now() }
      }, { timeout: 3000 });
      riskScore = mlResponse.data.risk_score || 0;
      riskFlags = mlResponse.data.flags || [];
    } catch { }

    const transferRecord = { tokenId, from: fromAddress, to: toAddress, location, notes: notes || "", timestamp: Date.now(), role: recipientRole, txHash };
    await TransferActivity.create(transferRecord);
    await Product.findOneAndUpdate({ tokenId }, { currentOwner: toAddress, riskScore, riskFlags });
    res.json({ success: true, txHash, riskScore, riskFlags });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/:tokenId/list-sale", async (req, res) => {
  try {
    const { priceWei, fromAddress } = req.body;
    const { tokenId } = req.params;
    if (!priceWei || !fromAddress) return res.status(400).json({ success: false, error: "priceWei and fromAddress required" });

    const { txHash } = await web3Service.listForSale(tokenId, priceWei, fromAddress);
    await Product.findOneAndUpdate({ tokenId }, { isForSale: true, priceWei });
    res.json({ success: true, txHash });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/:tokenId/buy", async (req, res) => {
  try {
    const { priceWei, fromAddress } = req.body;
    const { tokenId } = req.params;
    if (!priceWei || !fromAddress) return res.status(400).json({ success: false, error: "priceWei and fromAddress required" });

    const product = await Product.findOne({ tokenId });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    const prevOwner = product.currentOwner;

    // Create Order
    const order = new Order({ tokenId, seller: prevOwner, buyer: fromAddress, priceWei, status: "PENDING" });
    await order.save();

    const { txHash } = await web3Service.buyProduct(tokenId, priceWei, fromAddress);

    // Update Order & Create Payment
    order.status = "COMPLETED";
    order.txHash = txHash;
    order.completedAt = new Date();
    await order.save();

    const payment = new Payment({ orderId: order._id, payerAddress: fromAddress, payeeAddress: prevOwner, amountWei: priceWei, txHash });
    await payment.save();

    const transferRecord = { tokenId, from: prevOwner, to: fromAddress, location: "Marketplace Purchase", notes: "Purchased via Smart Contract", timestamp: Date.now(), role: "Customer", txHash };
    await TransferActivity.create(transferRecord);
    await Product.findOneAndUpdate({ tokenId }, { currentOwner: fromAddress, isForSale: false, priceWei: "0" });

    res.json({ success: true, txHash });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:tokenId/verify", async (req, res) => {
  try {
    const { tokenId } = req.params;
    const product = await Product.findOne({ tokenId });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    let blockchainVerified = false;
    try { const { isAuthentic } = await web3Service.verifyAuthenticity(tokenId); blockchainVerified = isAuthentic; } catch { }
    res.json({ success: true, verified: blockchainVerified && product.isAuthentic, riskScore: product.riskScore, riskFlags: product.riskFlags, product });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
