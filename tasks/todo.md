# EchoBox Development Tasks - ETHGlobal Hackathon

## 🎯 Target Prizes
- 🥇 **ENS ($10,000)**: Best use of L2 Primary Names ($4,000)
- 🥈 **PayPal USD ($10,000)**: Most Innovative Payment-Focused Use of PYUSD ($3,500)
- 🥉 **Additional**: Nora AI ($5,000), Gemini ($5,000), Privy ($5,000)

## Project Setup ✅
- [x] Initialize the project with proper package.json and dependencies
- [x] Set up Next.js with TypeScript configuration
- [x] Install and configure required dependencies (wagmi, ethers, tailwind, etc.)
- [x] Create .env.local file for environment variables (template created)
- [x] Set up project structure as outlined in CLAUDE.md

## Phase 1: Smart Contract Development (Hours 1-8)

### Core Contract Implementation ✅ (BASE COMPLETE)
- [x] Created `contracts/src/EchoBox.sol` with Gift struct
- [x] Implemented `createGift()` payable function with time-lock
- [x] Implemented `claimGift()` with proper validation
- [x] Added `getSentGifts()` and `getReceivedGifts()` view functions
- [x] Added events: GiftCreated, GiftClaimed
- [x] Error handling with custom errors
- [x] Message field for gift personalization

### Smart Contract Enhancements Needed for Prizes ✅ COMPLETE!
- [x] Add ENS name storage field to Gift struct (recipientENS string)
- [x] Modify `createGift()` to accept ENS name parameter
- [x] Add support for PYUSD (ERC20) gifts via `createTokenGift()`
- [x] Implement token type enum (ETH, ERC20)
- [x] Add PYUSD approval and transfer logic with SafeERC20
- [x] Add function `getGiftsByENS()` to query by ENS name
- [x] Add `getGiftDetails()` for UI-friendly data retrieval

### Testing & Security ✅ COMPLETE!
- [x] Comprehensive unit tests written (10 test cases in Foundry)
- [x] Time-lock mechanism tested
- [x] Error cases tested (NotRecipient, AlreadyClaimed, GiftLocked, etc.)
- [x] Deployment script ready (Deploy.s.sol)
- [x] ENS storage tested with test cases
- [x] PYUSD (ERC20) functionality tested with mock token
- [x] Deployed to Sepolia testnet at `0xb5aa12ccb861827a0d2daf47082780247a6d254e` ✅

## Phase 2: Frontend - Wallet Integration (Hours 9-12) ✅ COMPLETE!

### Privy Integration (Prize Target) ✅
- [x] Install and configure Privy SDK
- [x] Create Privy-based ConnectWallet component
- [x] Set up authentication flow
- [x] Create isolated demo at `/demo/privy`

### Coinbase Smart Wallet Support (Prize Target) ✅
- [x] Add Coinbase wallet SDK (@coinbase/wallet-sdk)
- [x] Create CoinbaseWalletProvider (isolated)
- [x] Create demo at `/demo/coinbase`
- [x] Test Smart Wallet integration

### Demo Pages for Judges ✅ NEW!
- [x] Create isolated provider architecture
- [x] Build separate demo pages (no conflicts)
- [x] Add navigation from main app
- [x] Test both demos independently

### Wagmi Configuration ✅
- [x] Update WalletProvider with Privy/multiple wallets
- [x] Configure chain settings for Sepolia
- [x] Set up contract instances with deployed address

## Phase 3: ENS Integration (Hours 13-16) 🎯
 Multi-Asset Gifting (ERC-20 + NFT) with Icons

## Goal

Extend EchoBox so a sender can choose **ETH / ERC-20 / ERC-721 / ERC-1155** as the gift asset. Add a clean **Asset Picker** with token icons and NFT inputs (contract address, tokenId, amount). Keep UX minimal and safe (ownership/allowance checks).

## TODO

* [ ] **Contracts:** Add `GiftBoxV2.sol` with `AssetType` enum and new create/claim functions for ERC-20, ERC-721, ERC-1155.
* [ ] **Scripts:** `scripts/deploy_v2.ts` to deploy and print the address.
* [ ] **Types:** `src/types/asset.ts` to strongly type asset selection.
* [ ] **Constants:** Expand `src/lib/constants.ts` with token registry + icon paths.
* [ ] **Helpers:** `src/lib/erc20.ts`, `src/lib/erc721.ts`, `src/lib/erc1155.ts` for approvals/ownership checks.
* [ ] **UI:** New `src/components/AssetPicker.tsx` (tabs for ETH / Token / NFT) with icons.
* [ ] **GiftForm:** Integrate picker; route to the right contract call with pre-checks (allowance/approval).
* [ ] **Public assets:** Add SVG icons in `/public/tokens/*.svg` (eth, usdc, pyusd, weth…) with fallback.
* [ ] **Tests:** Hardhat tests for ERC-20 / ERC-721 / ERC-1155 create+claim and revert paths.

---

## Acceptance Criteria

* Sender can pick **ETH / ERC-20 / ERC-721 / ERC-1155**.
* For ERC-20, UI prompts **approve → createGiftToken**.
* For ERC-721/1155, UI prompts **setApprovalForAll/approve → createGiftERC721/1155**.
* Claim works for all types after unlock.
* Icons show in the token list; NFT pane shows a minimal preview (symbol/address slice).
* ENS rules unchanged (forward for sending, reverse→forward for display).

---

## Contracts

### `contracts/GiftBoxV2.sol` (new)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

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
    }

    mapping(uint256 => Gift) public gifts;
    uint256 public nextId;

    event GiftCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        uint256 unlockTimestamp,
        AssetType assetType,
        address token,
        uint256 tokenId,
        uint256 amount
    );
    event GiftClaimed(uint256 indexed id, address indexed recipient);

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidUnlockTime();
    error NotRecipient();
    error NotUnlocked();
    error AlreadyClaimed();

    // --------- ETH ----------
    function createGiftETH(address recipient, uint256 unlockTimestamp) external payable {
        if (recipient == address(0)) revert InvalidRecipient();
        if (msg.value == 0) revert InvalidAmount();
        if (unlockTimestamp <= block.timestamp) revert InvalidUnlockTime();

        uint256 id = nextId++;
        gifts[id] = Gift(msg.sender, recipient, unlockTimestamp, false, AssetType.ETH, address(0), 0, msg.value);
        emit GiftCreated(id, msg.sender, recipient, unlockTimestamp, AssetType.ETH, address(0), 0, msg.value);
    }

    // --------- ERC-20 ----------
    function createGiftToken(address recipient, uint256 unlockTimestamp, address token, uint256 amount) external {
        if (recipient == address(0)) revert InvalidRecipient();
        if (token == address(0) || amount == 0) revert InvalidAmount();
        if (unlockTimestamp <= block.timestamp) revert InvalidUnlockTime();

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 id = nextId++;
        gifts[id] = Gift(msg.sender, recipient, unlockTimestamp, false, AssetType.ERC20, token, 0, amount);
        emit GiftCreated(id, msg.sender, recipient, unlockTimestamp, AssetType.ERC20, token, 0, amount);
    }

    // --------- ERC-721 ----------
    function createGiftERC721(address recipient, uint256 unlockTimestamp, address token, uint256 tokenId) external {
        if (recipient == address(0)) revert InvalidRecipient();
        if (token == address(0)) revert InvalidAmount();
        if (unlockTimestamp <= block.timestamp) revert InvalidUnlockTime();

        IERC721(token).safeTransferFrom(msg.sender, address(this), tokenId);

        uint256 id = nextId++;
        gifts[id] = Gift(msg.sender, recipient, unlockTimestamp, false, AssetType.ERC721, token, tokenId, 1);
        emit GiftCreated(id, msg.sender, recipient, unlockTimestamp, AssetType.ERC721, token, tokenId, 1);
    }

    // --------- ERC-1155 ----------
    function createGiftERC1155(address recipient, uint256 unlockTimestamp, address token, uint256 tokenId, uint256 amount) external {
        if (recipient == address(0)) revert InvalidRecipient();
        if (token == address(0) || amount == 0) revert InvalidAmount();
        if (unlockTimestamp <= block.timestamp) revert InvalidUnlockTime();

        IERC1155(token).safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        uint256 id = nextId++;
        gifts[id] = Gift(msg.sender, recipient, unlockTimestamp, false, AssetType.ERC1155, token, tokenId, amount);
        emit GiftCreated(id, msg.sender, recipient, unlockTimestamp, AssetType.ERC1155, token, tokenId, amount);
    }

    function claimGift(uint256 id) external nonReentrant {
        Gift storage g = gifts[id];
        if (msg.sender != g.recipient) revert NotRecipient();
        if (g.claimed) revert AlreadyClaimed();
        if (block.timestamp < g.unlockTimestamp) revert NotUnlocked();

        g.claimed = true;

        if (g.assetType == AssetType.ETH) {
            (bool ok,) = msg.sender.call{value: g.amount}("");
            require(ok, "ETH xfer failed");
        } else if (g.assetType == AssetType.ERC20) {
            IERC20(g.token).transfer(msg.sender, g.amount);
        } else if (g.assetType == AssetType.ERC721) {
            IERC721(g.token).safeTransferFrom(address(this), msg.sender, g.tokenId);
        } else {
            IERC1155(g.token).safeTransferFrom(address(this), msg.sender, g.tokenId, g.amount, "");
        }

        emit GiftClaimed(id, msg.sender);
    }
}
```

### `scripts/deploy_v2.ts` (new)

```ts
import { ethers } from "hardhat";

async function main() {
  const F = await ethers.getContractFactory("GiftBoxV2");
  const c = await F.deploy();
  await c.waitForDeployment();
  console.log("GiftBoxV2 deployed to:", await c.getAddress());
}
main().catch((e) => { console.error(e); process.exit(1); });
```

---

## Types

### `src/types/asset.ts` (new)

```ts
export type AssetType = "ETH" | "ERC20" | "ERC721" | "ERC1155";

export type TokenMeta = {
  symbol: string;
  address: `0x${string}` | null;   // null for ETH
  decimals?: number;               // ETH/20
  icon?: string;                   // /tokens/<symbol>.svg
};

export type NFTInput = {
  standard: "ERC721" | "ERC1155";
  address: `0x${string}`;
  tokenId: string;  // as string; cast to bigint when calling
  amount?: string;  // ERC1155 only
};
```

---

## Constants & Icons

### `src/lib/constants.ts` (extend)

```ts
import type { TokenMeta } from "@/types/asset";

export const TOKENS: TokenMeta[] = [
  { symbol: "ETH",  address: null,                         decimals: 18, icon: "/tokens/eth.svg" },
  { symbol: "USDC", address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "/tokens/usdc.svg" },
  { symbol: "PYUSD",address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "/tokens/pyusd.svg" },
  { symbol: "WETH", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "/tokens/weth.svg" },
];
// ↑ Replace placeholder addresses with your network’s addresses.
// Put SVGs in /public/tokens/{eth,usdc,pyusd,weth}.svg
```

---

## Helpers (approvals / checks)

### `src/lib/erc20.ts` (new)

```ts
import { erc20Abi } from "viem";
import { Address, createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { config } from "./wagmi";

export async function ensureErc20Allowance({
  token, owner, spender, amount, decimals,
  walletClient,
}: {
  token: Address; owner: Address; spender: Address; amount: string; decimals: number;
  walletClient: ReturnType<typeof createWalletClient>;
}) {
  const publicClient = createPublicClient({ chain: walletClient.chain!, transport: http() });
  const needed = parseUnits(amount, decimals);
  const current: bigint = await publicClient.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [owner, spender] });
  if (current < needed) {
    await walletClient.writeContract({ address: token, abi: erc20Abi, functionName: "approve", args: [spender, needed] });
  }
}
```

### `src/lib/erc721.ts` (new)

```ts
import { Address, createPublicClient, createWalletClient, http } from "viem";

const erc721Abi = [
  { name: "isApprovedForAll", type: "function", stateMutability: "view", inputs: [{name:"owner",type:"address"},{name:"operator",type:"address"}], outputs:[{type:"bool"}] },
  { name: "setApprovalForAll", type: "function", stateMutability: "nonpayable", inputs: [{name:"operator",type:"address"},{name:"approved",type:"bool"}], outputs:[] },
];

export async function ensureErc721ApprovalForAll({
  token, owner, operator, walletClient,
}: { token: Address; owner: Address; operator: Address; walletClient: ReturnType<typeof createWalletClient>; }) {
  const publicClient = createPublicClient({ chain: walletClient.chain!, transport: http() });
  const ok: boolean = await publicClient.readContract({ address: token, abi: erc721Abi, functionName: "isApprovedForAll", args: [owner, operator] });
  if (!ok) {
    await walletClient.writeContract({ address: token, abi: erc721Abi, functionName: "setApprovalForAll", args: [operator, true] });
  }
}
```

### `src/lib/erc1155.ts` (new)

```ts
import { Address, createPublicClient, createWalletClient, http } from "viem";

const erc1155Abi = [
  { name: "isApprovedForAll", type: "function", stateMutability: "view", inputs: [{name:"owner",type:"address"},{name:"operator",type:"address"}], outputs:[{type:"bool"}] },
  { name: "setApprovalForAll", type: "function", stateMutability: "nonpayable", inputs: [{name:"operator",type:"address"},{name:"approved",type:"bool"}], outputs:[] },
];

export async function ensureErc1155ApprovalForAll({
  token, owner, operator, walletClient,
}: { token: Address; owner: Address; operator: Address; walletClient: ReturnType<typeof createWalletClient>; }) {
  const publicClient = createPublicClient({ chain: walletClient.chain!, transport: http() });
  const ok: boolean = await publicClient.readContract({ address: token, abi: erc1155Abi, functionName: "isApprovedForAll", args: [owner, operator] });
  if (!ok) {
    await walletClient.writeContract({ address: token, abi: erc1155Abi, functionName: "setApprovalForAll", args: [operator, true] });
  }
}
```

---

## UI — Asset Picker

### `src/components/AssetPicker.tsx` (new)

```tsx
"use client";
import { useMemo, useState } from "react";
import type { AssetType, NFTInput, TokenMeta } from "@/types/asset";
import { TOKENS } from "@/lib/constants";

type Props = {
  onChange: (v: { type: AssetType; token?: TokenMeta; nft?: NFTInput; amount?: string }) => void;
  defaultType?: AssetType;
};

export default function AssetPicker({ onChange, defaultType = "ETH" }: Props) {
  const [type, setType] = useState<AssetType>(defaultType);
  const [token, setToken] = useState<TokenMeta | undefined>(TOKENS[0]);
  const [amount, setAmount] = useState<string>("");
  const [nft, setNft] = useState<NFTInput>({ standard: "ERC721", address: "0x0000000000000000000000000000000000000000", tokenId: "" });

  function emit(next?: Partial<{ type: AssetType; token: TokenMeta; nft: NFTInput; amount: string }>) {
    const v = { type, token, nft, amount, ...next } as any;
    onChange(v);
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["ETH","ERC20","ERC721","ERC1155"] as AssetType[]).map(t => (
          <button
            key={t}
            onClick={() => { setType(t); emit({ type: t }); }}
            className={`rounded-xl border px-3 py-2 ${type===t ? "bg-black/5" : "hover:bg-black/5"}`}
          >{t}</button>
        ))}
      </div>

      {/* ETH / ERC-20 */}
      {(type === "ETH" || type === "ERC20") && (
        <div className="space-y-3">
          {type === "ERC20" && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Token</label>
              <div className="grid gap-2">
                {TOKENS.filter(t => t.address).map(t => (
                  <button key={t.symbol} onClick={() => { setToken(t); emit({ token: t }); }}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${token?.symbol===t.symbol ? "bg-black/5" : "hover:bg-black/5"}`}>
                    <img src={t.icon ?? "/tokens/_fallback.svg"} alt={t.symbol} className="h-6 w-6 rounded-md" />
                    <span className="font-medium">{t.symbol}</span>
                    <span className="ml-auto text-xs opacity-60">{(t.address as string).slice(0,6)}…{(t.address as string).slice(-4)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium">Amount ({type === "ETH" ? "ETH" : token?.symbol ?? "Token"})</label>
            <input value={amount} onChange={e => { setAmount(e.target.value); emit({ amount: e.target.value }); }}
              placeholder="0.10" className="w-full rounded-xl border px-3 py-2" />
          </div>
        </div>
      )}

      {/* NFTs */}
      {(type === "ERC721" || type === "ERC1155") && (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Standard</label>
            <select value={nft.standard}
              onChange={e => { const std = e.target.value as "ERC721"|"ERC1155"; const next = { ...nft, standard: std }; setNft(next); emit({ nft: next }); }}
              className="rounded-xl border px-3 py-2">
              <option>ERC721</option>
              <option>ERC1155</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">NFT Contract Address</label>
            <input value={nft.address}
              onChange={e => { const next = { ...nft, address: e.target.value as any }; setNft(next); emit({ nft: next }); }}
              placeholder="0x…" className="w-full rounded-xl border px-3 py-2 font-mono" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Token ID</label>
            <input value={nft.tokenId}
              onChange={e => { const next = { ...nft, tokenId: e.target.value }; setNft(next); emit({ nft: next }); }}
              placeholder="e.g., 1234" className="w-full rounded-xl border px-3 py-2" />
          </div>

          {type === "ERC1155" && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Amount</label>
              <input value={nft.amount ?? ""} onChange={e => { const next = { ...nft, amount: e.target.value }; setNft(next); emit({ nft: next }); }}
                placeholder="1" className="w-full rounded-xl border px-3 py-2" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Integrate into `GiftForm.tsx` (key parts)

```tsx
import AssetPicker from "@/components/AssetPicker";
import { TOKENS } from "@/lib/constants";
import { ensureErc20Allowance } from "@/lib/erc20";
import { ensureErc721ApprovalForAll } from "@/lib/erc721";
import { ensureErc1155ApprovalForAll } from "@/lib/erc1155";
import { useAccount, useWriteContract } from "wagmi";
import type { AssetType } from "@/types/asset";

export default function GiftForm() {
  // …existing state
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [asset, setAsset] = useState<{ type: AssetType; token?: any; nft?: any; amount?: string }>({ type: "ETH" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;

    // Assume we have recipientAddress and unlockTs already
    if (asset.type === "ETH") {
      await writeContractAsync({
        abi: GiftBoxV2Abi, address: process.env.NEXT_PUBLIC_GIFTBOX_V2!,
        functionName: "createGiftETH",
        args: [recipientAddress, unlockTs],
        value: parseEther(asset.amount ?? "0"),
      });
    } else if (asset.type === "ERC20" && asset.token?.address) {
      await ensureErc20Allowance({
        token: asset.token.address, owner: address, spender: process.env.NEXT_PUBLIC_GIFTBOX_V2! as `0x${string}`,
        amount: asset.amount!, decimals: asset.token.decimals!,
        walletClient: (window as any).walletClient, // or from wagmi
      });
      await writeContractAsync({
        abi: GiftBoxV2Abi, address: process.env.NEXT_PUBLIC_GIFTBOX_V2!,
        functionName: "createGiftToken",
        args: [recipientAddress, unlockTs, asset.token.address, parseUnits(asset.amount!, asset.token.decimals!)],
      });
    } else if (asset.type === "ERC721" && asset.nft) {
      await ensureErc721ApprovalForAll({
        token: asset.nft.address, owner: address, operator: process.env.NEXT_PUBLIC_GIFTBOX_V2! as `0x${string}`,
        walletClient: (window as any).walletClient,
      });
      await writeContractAsync({
        abi: GiftBoxV2Abi, address: process.env.NEXT_PUBLIC_GIFTBOX_V2!,
        functionName: "createGiftERC721",
        args: [recipientAddress, unlockTs, asset.nft.address, BigInt(asset.nft.tokenId)],
      });
    } else if (asset.type === "ERC1155" && asset.nft) {
      await ensureErc1155ApprovalForAll({
        token: asset.nft.address, owner: address, operator: process.env.NEXT_PUBLIC_GIFTBOX_V2! as `0x${string}`,
        walletClient: (window as any).walletClient,
      });
      await writeContractAsync({
        abi: GiftBoxV2Abi, address: process.env.NEXT_PUBLIC_GIFTBOX_V2!,
        functionName: "createGiftERC1155",
        args: [recipientAddress, unlockTs, asset.nft.address, BigInt(asset.nft.tokenId), BigInt(asset.nft.amount ?? "1")],
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* …existing recipient + date/time inputs… */}
      <AssetPicker onChange={setAsset} />
      <button className="w-full rounded-2xl bg-teal-500 py-3 text-white">Create Gift</button>
    </form>
  );
}
```

---

## Icons

Add these files under `public/tokens/`:

* `eth.svg`, `usdc.svg`, `pyusd.svg`, `weth.svg`, and `_fallback.svg` (simple circle with initials).
  If you don’t have art yet, use monochrome glyphs; we can replace later.

---

## Tests (outline)

* ✅ **ERC-20**: create (with allowance), claim after unlock; reverts for zero amount, past time, non-recipient, double claim.
* ✅ **ERC-721**: create (with approvalForAll), claim; reverts on not unlocked, wrong recipient, double claim.
* ✅ **ERC-1155**: same as above, with amount > 1 case.
* ✅ Event payloads include all fields (asset type, token, tokenId, amount).

---

## Review Notes

* Keep the original `GiftBox.sol` (ETH/ERC-20) if already deployed; deploy **V2** in parallel and point the UI to V2.
* Use the same ENS logic; only asset selection is new.
* Keep diffs small: new files + minimal touches to `GiftForm.tsx`.

### ENS Resolution (Critical for Prize)
- [ ] Implement ENS → Address resolution in frontend
- [ ] Add reverse resolution (Address → ENS) for display
- [ ] Create ENS validation utilities
- [ ] Cache ENS lookups for performance

### ENS UI Components
- [ ] ENS input field with auto-validation
- [ ] ENS avatar display integration
- [ ] Show ENS names prominently throughout UI
- [ ] Add "resolved address" preview

## Phase 4: Gift Creation Flow (Hours 17-20)

### GiftForm Component
- [ ] Create form with ENS recipient input
- [ ] Add amount input with ETH/PYUSD toggle
- [ ] Implement date/time picker for unlock
- [ ] Add gift message field (optional)
- [ ] Transaction confirmation modal

### Transaction Handling
- [ ] Implement contract write functions
- [ ] Add loading states during transactions
- [ ] Handle transaction errors gracefully
- [ ] Show success notifications

## Phase 5: Gift Management UI (Hours 21-24)

### Gift Display Components
- [ ] Create GiftList with "Sent" and "Received" tabs
- [ ] Build GiftCard with gift details
- [ ] Add countdown timer for locked gifts
- [ ] Implement claim button for unlocked gifts

### Real-time Updates
- [ ] Listen for contract events
- [ ] Auto-refresh gift lists
- [ ] Update countdown timers
- [ ] Show claim success animations

## Phase 6: PYUSD Integration (Hours 25-28) 💰

### Token Integration
- [ ] Add PYUSD contract ABI (Sepolia: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a9c)
- [ ] Implement ERC20 approval flow
- [ ] Add balance checking
- [ ] Create token selector UI

### Payment Innovation (Prize Focus)
- [ ] Highlight PYUSD as stablecoin option
- [ ] Show USD value equivalents
- [ ] Add "recommended for international gifts" messaging

## Phase 7: Polish & Testing (Hours 29-36)

### UI/UX Enhancement
- [ ] Design attractive landing page
- [ ] Add smooth animations
- [ ] Implement responsive design
- [ ] Create loading skeletons
- [ ] Add tooltips and help text

### Comprehensive Testing
- [ ] Test complete gift flow (ETH)
- [ ] Test complete gift flow (PYUSD)
- [ ] Test ENS resolution edge cases
- [ ] Test time-lock accuracy
- [ ] Test on multiple wallets

## Phase 8: Documentation & Submission (Hours 37-48)

### Documentation
- [ ] Write comprehensive README
- [ ] Document smart contract functions
- [ ] Create user guide with screenshots
- [ ] Record demo video

### Prize-Specific Showcasing
- [ ] Emphasize ENS integration in demo
- [ ] Highlight PYUSD innovation
- [ ] Show Privy/Gemini wallet support
- [ ] Document any Nora AI usage

### Final Deployment
- [ ] Deploy contracts to mainnet (if required)
- [ ] Deploy frontend to Vercel
- [ ] Test production deployment
- [ ] Submit to hackathon platform

## Review

### Project Setup - Completed ✅

**Summary of changes made:**

1. **Package Management**
   - Created `package.json` with all necessary dependencies for Next.js, TypeScript, React, Tailwind CSS, wagmi, ethers.js, and development tools
   - Successfully installed all dependencies using `bun install`

2. **TypeScript Configuration**
   - Set up `tsconfig.json` with proper compiler options for Next.js and React
   - Configured path aliases for cleaner imports (@/components, @/lib, etc.)

3. **Build Configuration**
   - Created `next.config.js` with React strict mode and webpack configuration for web3 libraries
   - Set up `tailwind.config.js` with custom theme configuration and shadcn/ui components support
   - Configured `postcss.config.js` for Tailwind CSS processing

4. **App Structure**
   - Created Next.js App Router structure with `app/` directory
   - Set up `layout.tsx` with metadata and SEO configuration
   - Created `page.tsx` with dynamic import for the main App component
   - Configured `globals.css` with Tailwind directives and custom CSS variables for theming

5. **Environment Configuration**
   - Created `.env.local.example` template with all required environment variables for:
     - Ethereum network configuration
     - Smart contract addresses
     - WalletConnect project ID
     - ENS resolver configuration

**Next Steps:**
- Copy `.env.local.example` to `.env.local` and fill in actual values
- Start development server with `bun dev` to test the setup
- Begin smart contract development following TDD approach

### CLAUDE.md Update - Completed ✅

**Summary of changes made:**

1. **Structure and Format**
   - Updated CLAUDE.md with comprehensive structure following project governance standards
   - Fixed formatting issues and removed unnecessary content
   - Added proper section numbering and organization

2. **Environment Variables**
   - Added comprehensive environment variables section with descriptions
   - Included security notes for environment variable management
   - Listed all required variables for the EchoBox project

3. **Project Governance**
   - Added detailed coding standards and project governance section
   - Included branching strategy, PR requirements, and review process
   - Added security best practices and dependency management guidelines

4. **Commands and Tools**
   - Updated commands section to reflect Bun as package manager
   - Added comprehensive list of development commands
   - Included formatting and audit commands

5. **Documentation Structure**
   - Preserved all EchoBox-specific content including wallet integrations
   - Maintained ENS integration details and safety practices
   - Kept smart contract interface documentation
   - Preserved NYC merchant integration information

**Tests added/updated:**
- No tests modified in this documentation update

**Follow-ups:**
- CLAUDE.md is now properly structured and comprehensive
- All EchoBox project-specific information has been preserved
- Environment variables and commands are up to date
- Ready to proceed with development using this updated guidance
