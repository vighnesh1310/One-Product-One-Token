const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const web3Service = require("../middleware/web3Service");

const JWT_SECRET = process.env.JWT_SECRET || "supplychain_secret_2024";

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, walletAddress } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: "Name, email, password required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, error: "Email already registered" });
    const user = new User({ name, email, password, role: role || "manufacturer", walletAddress: walletAddress || "" });
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletAddress: user.walletAddress } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: "Email and password required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, error: "Invalid email or password" });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ success: false, error: "Invalid email or password" });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletAddress: user.walletAddress } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Get blockchain accounts (dev)
router.get("/accounts", async (req, res) => {
  try {
    const accounts = await web3Service.getAccounts();
    res.json({ success: true, accounts });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Register participant on blockchain
router.post("/blockchain-register", async (req, res) => {
  try {
    const { participantAddress, role, adminAddress } = req.body;
    const accounts = await web3Service.getAccounts();
    const admin = adminAddress || accounts[0];
    const { txHash } = await web3Service.registerParticipant(participantAddress, role, admin);
    res.json({ success: true, txHash });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Update Wallet Address
router.post("/update-wallet", async (req, res) => {
  try {
    const { userId, walletAddress } = req.body;
    if (!userId || !walletAddress) return res.status(400).json({ success: false, error: "User ID and Wallet Address required" });
    const user = await User.findByIdAndUpdate(userId, { walletAddress }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletAddress: user.walletAddress } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
