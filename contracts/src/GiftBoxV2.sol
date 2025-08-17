// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract GiftBoxV2 is ReentrancyGuard, ERC721Holder, ERC1155Holder {
    enum AssetType { ETH, ERC20, ERC721, ERC1155 }

    struct Gift {
        address sender;
        address recipient;
        uint256 unlockTimestamp;
        bool claimed;
        AssetType assetType;
        address token;     // address(0) for ETH
        uint256 tokenId;   // ERC721/1155 only
        uint256 amount;    // ETH/20 amount, or 1155 qty, or 1 for 721
        string recipientENS;  // ENS name for better UX
        string message;       // Personal message
    }

    mapping(uint256 => Gift) public gifts;
    mapping(address => uint256[]) private sentGifts;
    mapping(address => uint256[]) private receivedGifts;
    mapping(string => uint256[]) private giftsByENS;
    
    uint256 public nextId;

    event GiftCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        uint256 unlockTimestamp,
        AssetType assetType,
        address token,
        uint256 tokenId,
        uint256 amount,
        string recipientENS
    );
    
    event GiftClaimed(uint256 indexed id, address indexed recipient);

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidUnlockTime();
    error NotRecipient();
    error NotUnlocked();
    error AlreadyClaimed();
    error TransferFailed();

    // --------- ETH ----------
    function createGiftETH(
        address recipient, 
        uint256 unlockTimestamp,
        string memory recipientENS,
        string memory message
    ) external payable {
        if (recipient == address(0)) revert InvalidRecipient();
        if (msg.value == 0) revert InvalidAmount();
        if (unlockTimestamp <= block.timestamp) revert InvalidUnlockTime();

        uint256 id = nextId++;
        gifts[id] = Gift({
            sender: msg.sender,
            recipient: recipient,
            unlockTimestamp: unlockTimestamp,
            claimed: false,
            assetType: AssetType.ETH,
            token: address(0),
            tokenId: 0,
            amount: msg.value,
            recipientENS: recipientENS,
            message: message
        });
        
        sentGifts[msg.sender].push(id);
        receivedGifts[recipient].push(id);
        if (bytes(recipientENS).length > 0) {
            giftsByENS[recipientENS].push(id);
        }
        
        emit GiftCreated(id, msg.sender, recipient, unlockTimestamp, AssetType.ETH, address(0), 0, msg.value, recipientENS);
    }

    // --------- ERC-20 ----------
    function createGiftToken(
        address recipient, 
        uint256 unlockTimestamp, 
        address token, 
        uint256 amount,
        string memory recipientENS,
        string memory message
    ) external {
        if (recipient == address(0)) revert InvalidRecipient();
        if (token == address(0) || amount == 0) revert InvalidAmount();
        if (unlockTimestamp <= block.timestamp) revert InvalidUnlockTime();

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 id = nextId++;
        gifts[id] = Gift({
            sender: msg.sender,
            recipient: recipient,
            unlockTimestamp: unlockTimestamp,
            claimed: false,
            assetType: AssetType.ERC20,
            token: token,
            tokenId: 0,
            amount: amount,
            recipientENS: recipientENS,
            message: message
        });
        
        sentGifts[msg.sender].push(id);
        receivedGifts[recipient].push(id);
        if (bytes(recipientENS).length > 0) {
            giftsByENS[recipientENS].push(id);
        }
        
        emit GiftCreated(id, msg.sender, recipient, unlockTimestamp, AssetType.ERC20, token, 0, amount, recipientENS);
    }

    // --------- ERC-721 ----------
    function createGiftERC721(
        address recipient, 
        uint256 unlockTimestamp, 
        address token, 
        uint256 tokenId,
        string memory recipientENS,
        string memory message
    ) external {
        if (recipient == address(0)) revert InvalidRecipient();
        if (token == address(0)) revert InvalidAmount();
        if (unlockTimestamp <= block.timestamp) revert InvalidUnlockTime();

        IERC721(token).safeTransferFrom(msg.sender, address(this), tokenId);

        uint256 id = nextId++;
        gifts[id] = Gift({
            sender: msg.sender,
            recipient: recipient,
            unlockTimestamp: unlockTimestamp,
            claimed: false,
            assetType: AssetType.ERC721,
            token: token,
            tokenId: tokenId,
            amount: 1,
            recipientENS: recipientENS,
            message: message
        });
        
        sentGifts[msg.sender].push(id);
        receivedGifts[recipient].push(id);
        if (bytes(recipientENS).length > 0) {
            giftsByENS[recipientENS].push(id);
        }
        
        emit GiftCreated(id, msg.sender, recipient, unlockTimestamp, AssetType.ERC721, token, tokenId, 1, recipientENS);
    }

    // --------- ERC-1155 ----------
    function createGiftERC1155(
        address recipient, 
        uint256 unlockTimestamp, 
        address token, 
        uint256 tokenId, 
        uint256 amount,
        string memory recipientENS,
        string memory message
    ) external {
        if (recipient == address(0)) revert InvalidRecipient();
        if (token == address(0) || amount == 0) revert InvalidAmount();
        if (unlockTimestamp <= block.timestamp) revert InvalidUnlockTime();

        IERC1155(token).safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        uint256 id = nextId++;
        gifts[id] = Gift({
            sender: msg.sender,
            recipient: recipient,
            unlockTimestamp: unlockTimestamp,
            claimed: false,
            assetType: AssetType.ERC1155,
            token: token,
            tokenId: tokenId,
            amount: amount,
            recipientENS: recipientENS,
            message: message
        });
        
        sentGifts[msg.sender].push(id);
        receivedGifts[recipient].push(id);
        if (bytes(recipientENS).length > 0) {
            giftsByENS[recipientENS].push(id);
        }
        
        emit GiftCreated(id, msg.sender, recipient, unlockTimestamp, AssetType.ERC1155, token, tokenId, amount, recipientENS);
    }

    function claimGift(uint256 id) external nonReentrant {
        Gift storage g = gifts[id];
        if (msg.sender != g.recipient) revert NotRecipient();
        if (g.claimed) revert AlreadyClaimed();
        if (block.timestamp < g.unlockTimestamp) revert NotUnlocked();

        g.claimed = true;

        if (g.assetType == AssetType.ETH) {
            (bool ok,) = msg.sender.call{value: g.amount}("");
            if (!ok) revert TransferFailed();
        } else if (g.assetType == AssetType.ERC20) {
            IERC20(g.token).transfer(msg.sender, g.amount);
        } else if (g.assetType == AssetType.ERC721) {
            IERC721(g.token).safeTransferFrom(address(this), msg.sender, g.tokenId);
        } else {
            IERC1155(g.token).safeTransferFrom(address(this), msg.sender, g.tokenId, g.amount, "");
        }

        emit GiftClaimed(id, msg.sender);
    }
    
    // View functions
    function getSentGifts(address sender) external view returns (uint256[] memory) {
        return sentGifts[sender];
    }
    
    function getReceivedGifts(address recipient) external view returns (uint256[] memory) {
        return receivedGifts[recipient];
    }
    
    function getGiftsByENS(string memory ensName) external view returns (uint256[] memory) {
        return giftsByENS[ensName];
    }
    
    function getGiftDetails(uint256 id) external view returns (Gift memory) {
        return gifts[id];
    }
    
    function getMultipleGifts(uint256[] memory ids) external view returns (Gift[] memory) {
        Gift[] memory result = new Gift[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = gifts[ids[i]];
        }
        return result;
    }
}
