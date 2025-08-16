import hre from "hardhat";
const { ethers, run } = hre;

async function main() {
  console.log("Deploying EchoBox contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const EchoBox = await ethers.getContractFactory("EchoBox");
  const echoBox = await EchoBox.deploy();

  await echoBox.waitForDeployment();

  const contractAddress = await echoBox.getAddress();
  console.log("EchoBox deployed to:", contractAddress);

  // Verify the contract on Etherscan (if not on local network)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337n) {
    console.log("Waiting for block confirmations...");
    await echoBox.deploymentTransaction()?.wait(5);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  console.log("Deployment completed:", deploymentInfo);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
