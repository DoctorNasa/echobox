import { expect } from "chai";
import hre from "hardhat";
import { EchoBox } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("EchoBox", function () {
  let echoBox: EchoBox;
  let owner: SignerWithAddress;
  let recipient: SignerWithAddress;
  let sender: SignerWithAddress;

  beforeEach(async function () {
    [owner, sender, recipient] = await ethers.getSigners();
    
    const EchoBox = await ethers.getContractFactory("EchoBox");
    echoBox = await EchoBox.deploy();
    await echoBox.waitForDeployment();
  });

  describe("ETH Gifts", function () {
    it("Should create an ETH gift successfully", async function () {
      const amount = ethers.parseEther("1.0");
      const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const message = "Happy Birthday!";
      const ensName = "recipient.eth";

      await expect(
        echoBox.connect(sender).createGift(
          recipient.address,
          ensName,
          unlockTime,
          message,
          { value: amount }
        )
      ).to.emit(echoBox, "GiftCreated")
        .withArgs(0, sender.address, recipient.address, ensName, amount, unlockTime, 0, ethers.ZeroAddress);

      const giftDetails = await echoBox.getGiftDetails(0);
      expect(giftDetails.sender).to.equal(sender.address);
      expect(giftDetails.recipient).to.equal(recipient.address);
      expect(giftDetails.amount).to.equal(amount);
      expect(giftDetails.claimed).to.be.false;
    });

    it("Should not allow creating gift with zero value", async function () {
      const unlockTime = Math.floor(Date.now() / 1000) + 3600;
      
      await expect(
        echoBox.connect(sender).createGift(
          recipient.address,
          "recipient.eth",
          unlockTime,
          "Test message",
          { value: 0 }
        )
      ).to.be.revertedWithCustomError(echoBox, "NoValueSent");
    });

    it("Should not allow creating gift with past unlock time", async function () {
      const amount = ethers.parseEther("1.0");
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      await expect(
        echoBox.connect(sender).createGift(
          recipient.address,
          "recipient.eth",
          pastTime,
          "Test message",
          { value: amount }
        )
      ).to.be.revertedWithCustomError(echoBox, "InvalidUnlockDate");
    });

    it("Should allow claiming gift after unlock time", async function () {
      const amount = ethers.parseEther("1.0");
      const currentBlock = await ethers.provider.getBlock("latest");
      const unlockTime = currentBlock!.timestamp + 10; // 10 seconds from current block

      await echoBox.connect(sender).createGift(
        recipient.address,
        "recipient.eth",
        unlockTime,
        "Test message",
        { value: amount }
      );

      // Wait for unlock time to pass
      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine", []);

      const initialBalance = await ethers.provider.getBalance(recipient.address);

      await expect(echoBox.connect(recipient).claimGift(0))
        .to.emit(echoBox, "GiftClaimed")
        .withArgs(0, recipient.address, amount);

      const finalBalance = await ethers.provider.getBalance(recipient.address);
      expect(finalBalance).to.be.gt(initialBalance);

      const giftDetails = await echoBox.getGiftDetails(0);
      expect(giftDetails.claimed).to.be.true;
    });

    it("Should not allow claiming gift before unlock time", async function () {
      const amount = ethers.parseEther("1.0");
      const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      await echoBox.connect(sender).createGift(
        recipient.address,
        "recipient.eth",
        unlockTime,
        "Test message",
        { value: amount }
      );

      await expect(echoBox.connect(recipient).claimGift(0))
        .to.be.revertedWithCustomError(echoBox, "GiftLocked");
    });

    it("Should not allow non-recipient to claim gift", async function () {
      const amount = ethers.parseEther("1.0");
      const currentBlock = await ethers.provider.getBlock("latest");
      const unlockTime = currentBlock!.timestamp + 10;

      await echoBox.connect(sender).createGift(
        recipient.address,
        "recipient.eth",
        unlockTime,
        "Test message",
        { value: amount }
      );

      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine", []);

      await expect(echoBox.connect(sender).claimGift(0))
        .to.be.revertedWithCustomError(echoBox, "NotRecipient");
    });

    it("Should not allow double claiming", async function () {
      const amount = ethers.parseEther("1.0");
      const currentBlock = await ethers.provider.getBlock("latest");
      const unlockTime = currentBlock!.timestamp + 10;

      await echoBox.connect(sender).createGift(
        recipient.address,
        "recipient.eth",
        unlockTime,
        "Test message",
        { value: amount }
      );

      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine", []);

      await echoBox.connect(recipient).claimGift(0);

      await expect(echoBox.connect(recipient).claimGift(0))
        .to.be.revertedWithCustomError(echoBox, "AlreadyClaimed");
    });
  });

  describe("Gift Tracking", function () {
    it("Should track sent gifts correctly", async function () {
      const amount = ethers.parseEther("1.0");
      const unlockTime = Math.floor(Date.now() / 1000) + 3600;
      
      await echoBox.connect(sender).createGift(
        recipient.address,
        "recipient.eth",
        unlockTime,
        "Gift 1",
        { value: amount }
      );

      await echoBox.connect(sender).createGift(
        recipient.address,
        "recipient.eth",
        unlockTime,
        "Gift 2",
        { value: amount }
      );

      const sentGifts = await echoBox.getSentGifts(sender.address);
      expect(sentGifts.length).to.equal(2);
      expect(sentGifts[0]).to.equal(0);
      expect(sentGifts[1]).to.equal(1);
    });

    it("Should track received gifts correctly", async function () {
      const amount = ethers.parseEther("1.0");
      const unlockTime = Math.floor(Date.now() / 1000) + 3600;
      
      await echoBox.connect(sender).createGift(
        recipient.address,
        "recipient.eth",
        unlockTime,
        "Gift 1",
        { value: amount }
      );

      const receivedGifts = await echoBox.getReceivedGifts(recipient.address);
      expect(receivedGifts.length).to.equal(1);
      expect(receivedGifts[0]).to.equal(0);
    });

    it("Should track gifts by ENS name", async function () {
      const amount = ethers.parseEther("1.0");
      const unlockTime = Math.floor(Date.now() / 1000) + 3600;
      const ensName = "recipient.eth";
      
      await echoBox.connect(sender).createGift(
        recipient.address,
        ensName,
        unlockTime,
        "Gift 1",
        { value: amount }
      );

      const giftsByENS = await echoBox.getGiftsByENS(ensName);
      expect(giftsByENS.length).to.equal(1);
      expect(giftsByENS[0]).to.equal(0);
    });
  });
});
