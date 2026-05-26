#!/bin/bash
# OneToken Supply Chain – Quick Start Script
# Run this from the project root

echo "========================================"
echo "  OneToken Supply Chain – Quick Start"
echo "========================================"
echo ""

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from https://nodejs.org"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 not found. Install from https://python.org"; exit 1; }
command -v mongod >/dev/null 2>&1 || echo "⚠  MongoDB not found locally – make sure MONGO_URI in backend/.env points to a running instance"

echo "✅ Starting all services..."
echo ""
echo "📋 Steps:"
echo "  1. Start Hardhat node:  cd blockchain && npx hardhat node"
echo "  2. Deploy contract:     cd blockchain && npm run deploy"
echo "  3. Start backend:       cd backend   && npm run dev"
echo "  4. Start ML service:    cd ml        && uvicorn main:app --reload --port 8000"
echo "  5. Start frontend:      cd frontend  && npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo ""

# Install dependencies if node_modules missing
echo "📦 Installing dependencies..."
(cd blockchain && npm install --silent) && echo "  ✅ Blockchain deps installed"
(cd backend && npm install --silent) && echo "  ✅ Backend deps installed"
(cd frontend && npm install --silent) && echo "  ✅ Frontend deps installed"
(cd ml && pip install -r requirements.txt -q) && echo "  ✅ ML deps installed"

echo ""
echo "All dependencies installed!"
echo "Follow the steps above to start each service in separate terminals."
