
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin Contracts
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

abstract contract ERC721Holder is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes memory) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC1155Receiver is IERC165 {
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4);
}

abstract contract ERC1155Holder is ERC165, IERC1155Receiver {
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}

interface IERC1155 is IERC165 {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) external view returns (uint256[] memory);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address account, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external;
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external;
}

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;
    error ReentrancyGuardReentrantCall();
    constructor() {
        _status = NOT_ENTERED;
    }
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }
    function _nonReentrantBefore() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
    }
    function _nonReentrantAfter() private {
        _status = NOT_ENTERED;
    }
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// Main Contract
contract GiftBoxV2 is ReentrancyGuard, ERC721Holder, ERC1155Holder {
    enum AssetType { ETH, ERC20, ERC721, ERC1155 }

    struct Gift {
        address sender;
        address recipient;
        uint256 unlockTimestamp;
        bool claimed;
        AssetType assetType;
        address token;
        uint256 tokenId;
        uint256 amount;
        string recipientENS;
        string message;
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
