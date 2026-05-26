const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");

let web3;
let contract;
let deploymentInfo;

function getWeb3() {
  if (!web3) {
    const rpcUrl = process.env.BLOCKCHAIN_RPC || "http://127.0.0.1:8545";
    web3 = new Web3(rpcUrl);
  }
  return web3;
}

function getContract() {
  if (!contract) {
    const deployPath = path.join(__dirname, "../deployment.json");
    if (!fs.existsSync(deployPath)) {
      throw new Error("deployment.json not found. Run: cd blockchain && npm run deploy");
    }
    deploymentInfo = JSON.parse(fs.readFileSync(deployPath, "utf8"));
    const w3 = getWeb3();
    contract = new w3.eth.Contract(deploymentInfo.abi, deploymentInfo.address);
  }
  return contract;
}

async function getAccounts() {
  return await getWeb3().eth.getAccounts();
}

async function createProductToken(productData, fromAddress) {
  const c = getContract();
  const { productName, batchNumber, manufacturerName, manufacturerLocation, harvestDate } = productData;
  const harvestTimestamp = Math.floor(new Date(harvestDate).getTime() / 1000);

  const result = await c.methods
    .createProductToken(productName, batchNumber, manufacturerName, manufacturerLocation, harvestTimestamp)
    .send({ from: fromAddress, gas: 500000 });

  const tokenId = result.events.ProductCreated.returnValues.tokenId;
  return { tokenId: tokenId.toString(), txHash: result.transactionHash };
}

async function transferOwnership(tokenId, toAddress, location, notes, recipientRole, fromAddress) {
  const c = getContract();
  const roleMap = { manufacturer: 0, distributor: 1, retailer: 2, customer: 3 };
  const roleNum = typeof recipientRole === "string" ? roleMap[recipientRole.toLowerCase()] : recipientRole;

  const result = await c.methods
    .transferOwnership(tokenId, toAddress, roleNum, location, notes)
    .send({ from: fromAddress, gas: 300000 });
  return { txHash: result.transactionHash };
}

async function getProductHistory(tokenId) {
  const c = getContract();
  return await c.methods.getProductHistory(tokenId).call();
}

async function verifyAuthenticity(tokenId) {
  const c = getContract();
  const result = await c.methods.verifyAuthenticity(tokenId).call();
  return { isAuthentic: result[0], product: result[1] };
}

async function getProduct(tokenId) {
  const c = getContract();
  return await c.methods.getProduct(tokenId).call();
}

async function getTotalProducts() {
  const c = getContract();
  return await c.methods.getTotalProducts().call();
}

async function registerParticipant(participantAddress, role, adminAddress) {
  const c = getContract();
  const roleMap = { manufacturer: 0, distributor: 1, retailer: 2, customer: 3 };
  const roleNum = roleMap[role.toLowerCase()] ?? 3;
  const result = await c.methods
    .registerParticipant(participantAddress, roleNum)
    .send({ from: adminAddress, gas: 100000 });
  return { txHash: result.transactionHash };
}

async function listForSale(tokenId, priceWei, fromAddress) {
  const c = getContract();
  const result = await c.methods
    .listForSale(tokenId, priceWei)
    .send({ from: fromAddress, gas: 300000 });
  return { txHash: result.transactionHash };
}

async function buyProduct(tokenId, priceWei, fromAddress) {
  const c = getContract();
  const result = await c.methods
    .buyProduct(tokenId)
    .send({ from: fromAddress, value: priceWei, gas: 500000 });
  return { txHash: result.transactionHash };
}

module.exports = {
  getWeb3, getContract, getAccounts,
  createProductToken, transferOwnership,
  getProductHistory, verifyAuthenticity,
  getProduct, getTotalProducts, registerParticipant,
  listForSale, buyProduct
};
