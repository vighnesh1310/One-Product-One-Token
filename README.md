# ⬡ OneToken – Blockchain Supply Chain with ML Fraud Detection

## 🆕 New in This Version
- ✅ **Home Page** – Landing page with features, flow, and CTA
- ✅ **Login / Register Page** – JWT authentication with role selection
- ✅ **Transfer Bug Fixed** – Smart contract no longer requires recipient to be pre-registered (auto-registers)
- ✅ **6 Reports** – Inventory, Transfer Activity, Fraud & Risk, Authenticity, Supply Chain Flow, ML Analytics (all CSV downloadable)

## 🚀 Quick Start

### Prerequisites: Node.js v18+, Python 3.9+, MongoDB running

### Step 1 – Blockchain
```bash
cd blockchain
npm install
npx hardhat node          # Terminal 1: keep open
npm run deploy            # Terminal 2: deploy contract
```

### Step 2 – Backend
```bash
cd backend
npm install
npm run dev               # Terminal 3
```

### Step 3 – ML Service
```bash
cd ml
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # Terminal 4
```

### Step 4 – Frontend
```bash
cd frontend
npm install
npm run dev               # Terminal 5
```

Open **http://localhost:3000**

---

## 📁 Pages
| Page | Description |
|------|-------------|
| Home | Landing page with features, flow diagram, CTA |
| Login/Register | JWT auth, role selection (manufacturer/distributor/retailer/customer/admin) |
| Dashboard | Stats, recent products, quick nav |
| Register Product | Mint blockchain token + QR code |
| Transfer Ownership | Transfer with ML fraud check (FIXED) |
| Verify Product | Scan QR / enter Token ID |
| Product History | Full transfer timeline |
| Reports (6) | Inventory · Transfers · Fraud · Authenticity · Supply Flow · ML Analytics |

## 📊 6 Reports
1. **Inventory Summary** – All products with batch, manufacturer, risk
2. **Transfer Activity** – Every on-chain transfer with addresses and timestamps
3. **Fraud & Risk** – High/medium/low risk items, all ML flags
4. **Authenticity** – Authentic vs flagged, verification rate %
5. **Supply Chain Flow** – Visual route per product token
6. **ML Analytics** – Risk distribution, top fraud flags, model insights

All reports support **CSV download**.

## 🔐 Smart Contract Fix
The `transferOwnership()` function was fixed:
- **Before:** Required recipient to be pre-registered (caused "Not registered" error)  
- **After:** Auto-registers any recipient address as Distributor role on transfer
