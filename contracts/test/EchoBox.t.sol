// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/EchoBox.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing (represents PYUSD)
contract MockPYUSD is ERC20 {
    constructor() ERC20("PayPal USD", "PYUSD") {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1M tokens
    }
}

contract EchoBoxTest is Test {
    EchoBox public echoBox;
    MockPYUSD public pyusd;
    address public sender = address(0x1);
    address payable public recipient = payable(address(0x2));
    uint256 public constant SEND_VALUE = 1 ether;
    uint256 public constant TOKEN_AMOUNT = 100 * 10**18; // 100 PYUSD
    string public constant ENS_NAME = "vitalik.eth";

    event GiftCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        string recipientENS,
        uint256 amount,
        uint256 unlockTimestamp,
        EchoBox.TokenType tokenType,
        address tokenAddress
    );
    event GiftClaimed(uint256 indexed id, address indexed recipient, uint256 amount);

    function setUp() public {
        echoBox = new EchoBox();
        pyusd = new MockPYUSD();
        
        // Transfer some PYUSD to sender for testing
        pyusd.transfer(sender, TOKEN_AMOUNT * 10);
    }

    function _createGift(
        address _sender,
        address payable _recipient,
        string memory _recipientENS,
        uint256 _amount,
        uint256 _unlockTimestamp,
        string memory _message
    ) internal {
        vm.prank(_sender);
        vm.deal(_sender, _amount);
        echoBox.createGift{value: _amount}(_recipient, _recipientENS, _unlockTimestamp, _message);
    }

    // Test successful ETH gift creation with ENS
    function test_CreateGift_WithENS() public {
        uint256 unlockTimestamp = block.timestamp + 1 days;
        string memory message = "Happy Birthday!";

        vm.expectEmit(true, true, true, false);
        emit GiftCreated(
            0, 
            sender, 
            recipient, 
            ENS_NAME,
            SEND_VALUE, 
            unlockTimestamp,
            EchoBox.TokenType.ETH,
            address(0)
        );

        _createGift(sender, recipient, ENS_NAME, SEND_VALUE, unlockTimestamp, message);

        // Check gift details
        (
            address giftSender,
            address giftRecipient,
            string memory giftENS,
            uint256 giftAmount,
            uint256 giftUnlock,
            string memory giftMessage,
            bool giftClaimed,
            EchoBox.TokenType tokenType,
            address tokenAddress
        ) = echoBox.getGiftDetails(0);
        
        assertEq(giftSender, sender);
        assertEq(giftRecipient, recipient);
        assertEq(giftENS, ENS_NAME);
        assertEq(giftAmount, SEND_VALUE);
        assertEq(giftUnlock, unlockTimestamp);
        assertEq(giftMessage, message);
        assertEq(giftClaimed, false);
        assertTrue(tokenType == EchoBox.TokenType.ETH);
        assertEq(tokenAddress, address(0));

        // Check ENS mapping
        uint256[] memory ensgifts = echoBox.getGiftsByENS(ENS_NAME);
        assertEq(ensgifts.length, 1);
        assertEq(ensgifts[0], 0);
    }

    // Test successful PYUSD gift creation
    function test_CreateTokenGift_PYUSD() public {
        uint256 unlockTimestamp = block.timestamp + 1 days;
        string memory message = "Happy Holidays!";

        // Approve token transfer
        vm.prank(sender);
        pyusd.approve(address(echoBox), TOKEN_AMOUNT);

        vm.expectEmit(true, true, true, false);
        emit GiftCreated(
            0,
            sender,
            recipient,
            ENS_NAME,
            TOKEN_AMOUNT,
            unlockTimestamp,
            EchoBox.TokenType.ERC20,
            address(pyusd)
        );

        vm.prank(sender);
        echoBox.createTokenGift(
            recipient,
            ENS_NAME,
            address(pyusd),
            TOKEN_AMOUNT,
            unlockTimestamp,
            message
        );

        // Verify token was transferred to contract
        assertEq(pyusd.balanceOf(address(echoBox)), TOKEN_AMOUNT);
    }

    // Test successful ETH gift claim
    function test_ClaimGift_ETH() public {
        uint256 unlockTimestamp = block.timestamp + 1 days;
        _createGift(sender, recipient, ENS_NAME, SEND_VALUE, unlockTimestamp, "");

        vm.warp(unlockTimestamp + 1);

        uint256 initialBalance = recipient.balance;

        vm.expectEmit(true, true, false, true);
        emit GiftClaimed(0, recipient, SEND_VALUE);

        vm.prank(recipient);
        echoBox.claimGift(0);

        (, , , , , , bool claimed, ,) = echoBox.getGiftDetails(0);
        assertTrue(claimed);
        assertEq(recipient.balance, initialBalance + SEND_VALUE);
    }

    // Test successful PYUSD gift claim
    function test_ClaimGift_PYUSD() public {
        uint256 unlockTimestamp = block.timestamp + 1 days;
        
        // Create PYUSD gift
        vm.prank(sender);
        pyusd.approve(address(echoBox), TOKEN_AMOUNT);
        vm.prank(sender);
        echoBox.createTokenGift(
            recipient,
            ENS_NAME,
            address(pyusd),
            TOKEN_AMOUNT,
            unlockTimestamp,
            ""
        );

        vm.warp(unlockTimestamp + 1);

        uint256 initialBalance = pyusd.balanceOf(recipient);

        vm.expectEmit(true, true, false, true);
        emit GiftClaimed(0, recipient, TOKEN_AMOUNT);

        vm.prank(recipient);
        echoBox.claimGift(0);

        assertEq(pyusd.balanceOf(recipient), initialBalance + TOKEN_AMOUNT);
    }

    // Test revert on claim if not recipient
    function test_Fail_ClaimGift_NotRecipient() public {
        uint256 unlockTimestamp = block.timestamp + 1 days;
        _createGift(sender, recipient, ENS_NAME, SEND_VALUE, unlockTimestamp, "");
        
        vm.warp(unlockTimestamp + 1);
        
        vm.expectRevert(EchoBox.NotRecipient.selector);
        vm.prank(sender);
        echoBox.claimGift(0);
    }

    // Test revert on claim if already claimed
    function test_Fail_ClaimGift_AlreadyClaimed() public {
        uint256 unlockTimestamp = block.timestamp + 1 days;
        _createGift(sender, recipient, ENS_NAME, SEND_VALUE, unlockTimestamp, "");

        vm.warp(unlockTimestamp + 1);
        vm.prank(recipient);
        echoBox.claimGift(0);

        vm.expectRevert(EchoBox.AlreadyClaimed.selector);
        vm.prank(recipient);
        echoBox.claimGift(0);
    }

    // Test revert on claim if gift is still locked
    function test_Fail_ClaimGift_GiftLocked() public {
        uint256 unlockTimestamp = block.timestamp + 1 days;
        _createGift(sender, recipient, ENS_NAME, SEND_VALUE, unlockTimestamp, "");

        vm.expectRevert(EchoBox.GiftLocked.selector);
        vm.prank(recipient);
        echoBox.claimGift(0);
    }

    // Test revert on creation with no value
    function test_Fail_CreateGift_NoValue() public {
        vm.expectRevert(EchoBox.NoValueSent.selector);
        echoBox.createGift(recipient, ENS_NAME, block.timestamp + 1 days, "");
    }

    // Test revert on creation with invalid recipient address
    function test_Fail_CreateGift_InvalidRecipient() public {
        vm.expectRevert(EchoBox.InvalidRecipient.selector);
        _createGift(sender, payable(address(0)), ENS_NAME, SEND_VALUE, block.timestamp + 1 days, "");
    }

    // Test revert on creation with past unlock date
    function test_Fail_CreateGift_InvalidUnlockDate() public {
        vm.expectRevert(EchoBox.InvalidUnlockDate.selector);
        _createGift(sender, recipient, ENS_NAME, SEND_VALUE, block.timestamp - 1, "");
    }
}
