const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// Fix for BigInt JSON serialization
BigInt.prototype.toJSON = function() { return this.toString() };

const productRoutes = require("./routes/products");
const mlRoutes = require("./routes/ml");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/supply_chain")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB:", err.message));

app.use("/api/products", productRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/auth", authRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
