import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("Deploying EchoBox contract to local network...");

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

  // Save deployment info for local development
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    contractAddress: contractAddress,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  console.log("Local deployment completed:", deploymentInfo);
  
  // Test the contract with a sample transaction
  console.log("\nTesting contract functionality...");
  const testRecipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Second hardhat account
  const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const message = "Test gift from deployment script";
  const ensName = "test.eth";

  const tx = await echoBox.createGift(
    testRecipient,
    ensName,
    unlockTime,
    message,
    { value: ethers.parseEther("0.1") }
  );

  await tx.wait();
  console.log("Test gift created successfully!");

  const giftDetails = await echoBox.getGiftDetails(0);
  console.log("Gift details:", {
    sender: giftDetails.sender,
    recipient: giftDetails.recipient,
    amount: ethers.formatEther(giftDetails.amount),
    unlockTimestamp: new Date(Number(giftDetails.unlockTimestamp) * 1000).toISOString(),
    message: giftDetails.message,
    claimed: giftDetails.claimed
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
