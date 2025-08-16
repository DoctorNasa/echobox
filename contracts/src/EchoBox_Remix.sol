// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// Import OpenZeppelin contracts directly from GitHub for Remix
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EchoBox {
    using SafeERC20 for IERC20;

    enum TokenType {
        ETH,
        ERC20
    }

    struct Gift {
        uint256 id;
        address payable sender;
        address payable recipient;
        string recipientENS;  // ENS name for prize eligibility
        uint256 amount;
        uint256 unlockTimestamp;
        string message;
        bool claimed;
        TokenType tokenType;
        address tokenAddress; // Address of ERC20 token (0x0 for ETH)
    }

    uint256 private _giftCounter;

    mapping(uint256 => Gift) public gifts;
    mapping(address => uint256[]) private _giftsBySender;
    mapping(address => uint256[]) private _giftsByRecipient;
    mapping(string => uint256[]) private _giftsByENS; // Track gifts by ENS name

    event GiftCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        string recipientENS,
        uint256 amount,
        uint256 unlockTimestamp,
        TokenType tokenType,
        address tokenAddress
    );
    event GiftClaimed(uint256 indexed id, address indexed recipient, uint256 amount);

    error NotRecipient();
    error AlreadyClaimed();
    error GiftLocked();
    error InvalidRecipient();
    error InvalidUnlockDate();
    error NoValueSent();
    error InvalidToken();
    error TransferFailed();
    error InsufficientAllowance();

    // Create ETH gift with ENS name
    function createGift(
        address payable _recipient,
        string memory _recipientENS,
        uint256 _unlockTimestamp,
        string memory _message
    ) public payable {
        if (msg.value == 0) revert NoValueSent();
        if (_recipient == address(0)) revert InvalidRecipient();
        if (_unlockTimestamp <= block.timestamp) revert InvalidUnlockDate();

        uint256 giftId = _giftCounter;
        gifts[giftId] = Gift({
            id: giftId,
            sender: payable(msg.sender),
            recipient: _recipient,
            recipientENS: _recipientENS,
            amount: msg.value,
            unlockTimestamp: _unlockTimestamp,
            message: _message,
            claimed: false,
            tokenType: TokenType.ETH,
            tokenAddress: address(0)
        });

        _giftsBySender[msg.sender].push(giftId);
        _giftsByRecipient[_recipient].push(giftId);
        if (bytes(_recipientENS).length > 0) {
            _giftsByENS[_recipientENS].push(giftId);
        }

        _giftCounter++;

        emit GiftCreated(
            giftId, 
            msg.sender, 
            _recipient, 
            _recipientENS,
            msg.value, 
            _unlockTimestamp,
            TokenType.ETH,
            address(0)
        );
    }

    // Create ERC20 token gift (e.g., PYUSD) with ENS name
    function createTokenGift(
        address payable _recipient,
        string memory _recipientENS,
        address _tokenAddress,
        uint256 _amount,
        uint256 _unlockTimestamp,
        string memory _message
    ) public {
        if (_amount == 0) revert NoValueSent();
        if (_recipient == address(0)) revert InvalidRecipient();
        if (_tokenAddress == address(0)) revert InvalidToken();
        if (_unlockTimestamp <= block.timestamp) revert InvalidUnlockDate();

        // Transfer tokens from sender to this contract
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 giftId = _giftCounter;
        _giftCounter++;
        
        // Create gift struct
        Gift storage newGift = gifts[giftId];
        newGift.id = giftId;
        newGift.sender = payable(msg.sender);
        newGift.recipient = _recipient;
        newGift.recipientENS = _recipientENS;
        newGift.amount = _amount;
        newGift.unlockTimestamp = _unlockTimestamp;
        newGift.message = _message;
        newGift.claimed = false;
        newGift.tokenType = TokenType.ERC20;
        newGift.tokenAddress = _tokenAddress;

        _giftsBySender[msg.sender].push(giftId);
        _giftsByRecipient[_recipient].push(giftId);
        if (bytes(_recipientENS).length > 0) {
            _giftsByENS[_recipientENS].push(giftId);
        }

        emit GiftCreated(
            giftId,
            msg.sender,
            _recipient,
            _recipientENS,
            _amount,
            _unlockTimestamp,
            TokenType.ERC20,
            _tokenAddress
        );
    }

    function claimGift(uint256 _id) public {
        Gift storage gift = gifts[_id];

        if (msg.sender != gift.recipient) revert NotRecipient();
        if (gift.claimed) revert AlreadyClaimed();
        if (block.timestamp < gift.unlockTimestamp) revert GiftLocked();

        gift.claimed = true;
        
        if (gift.tokenType == TokenType.ETH) {
            (bool success, ) = gift.recipient.call{value: gift.amount}("");
            require(success, "Failed to send Ether");
        } else {
            IERC20(gift.tokenAddress).safeTransfer(gift.recipient, gift.amount);
        }

        emit GiftClaimed(_id, gift.recipient, gift.amount);
    }
    
    function getSentGifts(address _user) public view returns (uint256[] memory) {
        return _giftsBySender[_user];
    }

    function getReceivedGifts(address _user) public view returns (uint256[] memory) {
        return _giftsByRecipient[_user];
    }

    // Get gifts by ENS name (for ENS prize eligibility)
    function getGiftsByENS(string memory _ensName) public view returns (uint256[] memory) {
        return _giftsByENS[_ensName];
    }

    // Check if a token is supported (helper for UI)
    function isTokenSupported(address _tokenAddress) public pure returns (bool) {
        // In production, you might want to maintain a whitelist
        // For hackathon, we'll accept any ERC20
        return _tokenAddress != address(0);
    }

    // Get gift details in a more UI-friendly format
    function getGiftDetails(uint256 _id) public view returns (
        address sender,
        address recipient,
        string memory recipientENS,
        uint256 amount,
        uint256 unlockTimestamp,
        string memory message,
        bool claimed,
        TokenType tokenType,
        address tokenAddress
    ) {
        Gift memory gift = gifts[_id];
        return (
            gift.sender,
            gift.recipient,
            gift.recipientENS,
            gift.amount,
            gift.unlockTimestamp,
            gift.message,
            gift.claimed,
            gift.tokenType,
            gift.tokenAddress
        );
    }
}
