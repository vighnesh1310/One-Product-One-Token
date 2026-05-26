const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying SupplyChain contract...");

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();

  const address = await supplyChain.getAddress();
  console.log(`SupplyChain deployed to: ${address}`);

  // Save contract address and ABI for backend
  const artifact = await hre.artifacts.readArtifact("SupplyChain");
  const deploymentInfo = {
    address,
    abi: artifact.abi,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${outputPath}`);

  // Also copy to backend
  const backendPath = path.join(__dirname, "../../backend/deployment.json");
  fs.writeFileSync(backendPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info copied to backend`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
