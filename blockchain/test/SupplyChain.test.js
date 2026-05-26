const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain", function () {
  let supplyChain, owner, distributor, retailer;

  beforeEach(async function () {
    [owner, distributor, retailer] = await ethers.getSigners();
    const SC = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SC.deploy();
    await supplyChain.waitForDeployment();
  });

  it("Should create a product token", async function () {
    const tx = await supplyChain.createProductToken(
      "Alphonso Mango", "BATCH-001", "Kolhapur Farms", "Kolhapur", 1700000000
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(l => l.fragment?.name === "ProductCreated");
    expect(event).to.not.be.undefined;

    const product = await supplyChain.getProduct(1);
    expect(product.productName).to.equal("Alphonso Mango");
    expect(product.isAuthentic).to.equal(true);
  });

  it("Should transfer ownership", async function () {
    await supplyChain.createProductToken("Mango", "B001", "Farm", "Kolhapur", 1700000000);
    await supplyChain.registerParticipant(distributor.address, 1);
    await supplyChain.transferOwnership(1, distributor.address, "Mumbai", "Quality checked");

    const product = await supplyChain.getProduct(1);
    expect(product.currentOwner).to.equal(distributor.address);
  });

  it("Should return full transfer history", async function () {
    await supplyChain.createProductToken("Mango", "B001", "Farm", "Kolhapur", 1700000000);
    await supplyChain.registerParticipant(distributor.address, 1);
    await supplyChain.transferOwnership(1, distributor.address, "Mumbai", "Step 2");

    const history = await supplyChain.getProductHistory(1);
    expect(history.length).to.equal(2);
    expect(history[1].location).to.equal("Mumbai");
  });

  it("Should verify authenticity", async function () {
    await supplyChain.createProductToken("Mango", "B001", "Farm", "Kolhapur", 1700000000);
    const [isAuthentic] = await supplyChain.verifyAuthenticity(1);
    expect(isAuthentic).to.equal(true);
  });

  it("Admin can flag a product", async function () {
    await supplyChain.createProductToken("Mango", "B001", "Farm", "Kolhapur", 1700000000);
    await supplyChain.flagProduct(1);
    const [isAuthentic] = await supplyChain.verifyAuthenticity(1);
    expect(isAuthentic).to.equal(false);
  });
});
