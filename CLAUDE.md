# CLAUDE.md — EchoBox (Time-Locked Gifts via ENS)

> **Purpose**  
> This file tells Claude how to work inside the EchoBox repo: what the project does, how it's structured, and exactly how Claude should plan, propose, implement, and review changes.

_Last updated: 2025-08-16 (Sepolia deployment complete)_

---

## 0) How Claude Should Work Here

1. **Think → Plan**: Read the repo. Draft a short plan in `tasks/todo.md` before coding. Keep changes tiny and reversible.  
2. **Checklist**: Convert the plan to checkable TODOs.  
3. **Checkpoint**: Pause for Project Manager (human) approval **before** implementation.  
4. **Implement**: Do one TODO at a time. Update/add tests alongside code.  
5. **Explain**: After each step, add a brief summary of what changed and why.  
6. **Refactor**: Prefer readability/maintainability improvements without behavior change.  
7. **Review Note**: Append a `## Review` section to `tasks/todo.md` (what shipped, risks, follow-ups).

> Claude: When you reply in chat, reference the section(s) you followed (e.g., “Per §0 and §6.3…”). For ambiguous tasks, propose 2–3 minimal options.

---

## 1) Project Overview

- **Name:** EchoBox
- **One-liner:** Send crypto gifts that unlock in the future, addressed by **ENS** names.
- **Primary goal:** A friendly way to gift crypto for birthdays, holidays, and milestones.
- **Stack:** Next.js (App Router), TypeScript, Tailwind, wagmi+viem, Lucide, Solidity, Hardhat, Bun, Vitest.
- **Chains:** Ethereum mainnet/L2s; Sepolia for testing.
- **Tokens:** ETH, ERC-20 (PYUSD mainnet/testnet supported).
- **Deployment Status:** ✅ **Live on Sepolia** - Contract verified and ready for testing
- **Docs siblings:** `MERCHANTS.md` (NYC merchants guide & compliance pointers).

---

## 2) Team Personas (Pick when addressed)

- **Agent_Architect (สถาปนิก)** — System design & scalability.  
- **Agent_TDD_Specialist (ผู้เชี่ยวชาญ TDD)** — Tests first; coverage & edge cases.  
- **Agent_Refactorer (ผู้ปรับปรุงโค้ด)** — Code quality & gas efficiency (no behavior change).  
- **Project_Manager (ผู้จัดการโปรเจกต์)** — Human; approves plans and merges.

---

## 3) Repository Layout (Essential Paths)

```
/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Root layout: providers & global UI
│  │  ├─ page.tsx                # Home
│  │  ├─ connect/                # Generic wagmi connect page
│  │  │  └─ page.tsx
│  │  ├─ connect-gemini/         # Gemini-only connect flow (via native or WalletConnect)
│  │  │  └─ page.tsx
│  │  ├─ connect-privy/          # Privy User SDK-only connect flow
│  │  │  └─ page.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ Navbar.tsx
│  │  ├─ ConnectWallet.tsx
│  │  ├─ GiftForm.tsx
│  │  ├─ GiftList.tsx
│  │  ├─ GiftCard.tsx
│  │  └─ WalletProvider.tsx
│  ├─ lib/
│  │  ├─ wagmi.ts                # wagmi/viem config & connectors
│  │  ├─ constants.ts            # Contract addresses, ABIs, token registry
│  │  ├─ ens.ts                  # ENS forward + reverse-verify helpers
│  │  └─ erc20.ts                # Minimal ERC-20 helpers
│  └─ types/
│     └─ gift.ts
├─ contracts/
│  ├─ contracts/
│  │  └─ EchoBox.sol             # Lock & claim gifts (deployed to Sepolia)
│  ├─ scripts/
│  │  ├─ deploy.ts               # Production deployment script
│  │  └─ deploy-local.ts         # Local development deployment
│  ├─ test/
│  │  └─ EchoBox.test.ts         # Comprehensive test suite (10 tests passing)
│  ├─ hardhat.config.ts          # Hardhat configuration
│  └─ package.json               # Contract dependencies
├─ tasks/
│  └─ todo.md                    # Plans + Review notes
├─ test/                         # Hardhat + Vitest
├─ tailwind.config.js
└─ bunfig.toml

```

---

## 4) Smart Contract (EchoBox.sol) — Deployed Interface

**🚀 Deployed on Sepolia:** `0x6802ec0997148cd10257c449702E900405c64cbC`
**📋 Verified on RoutesScan:** https://testnet.routescan.io/address/0x6802ec0997148cd10257c449702E900405c64cbC/contract/11155111/writeContract?chainid=11155111

### Core Functions:
- `createGift(address recipient, string ensName, uint256 unlockTimestamp, string message)` **payable**
  - Locks ETH until `unlockTimestamp`. Validates recipient, non-zero value, future time.
- `createTokenGift(address recipient, string ensName, address token, uint256 amount, uint256 unlockTimestamp, string message)`
  - Pulls ERC-20 (via `approve`+`transferFrom`) and locks until unlock.
- `claimGift(uint256 giftId)`
  - Only `recipient` can claim after unlock; idempotent; safe transfer; emits events.
- `getGiftDetails(uint256 id) view returns (Gift)` / `getSentGifts(address user)` / `getReceivedGifts(address user)` / `getGiftsByENS(string ensName)`.

### Enhanced Features:
- **ENS Support:** Track gifts by ENS names for prize eligibility
- **Message Support:** Include personal messages with gifts
- **Comprehensive Tracking:** Query gifts by sender, recipient, or ENS name

**Security notes:** ReentrancyGuard, Checks-Effects-Interactions, custom errors for gas efficiency, SafeERC20 transfers.

---

## 5) Frontend Flow (Key Rules)

- **Connect**: Wallet via wagmi on `/connect`. Also ship dedicated pages:
  - **Gemini-only**: prefer a native Gemini connector if present; otherwise route via WalletConnect labeled “Gemini”. (Follow wagmi’s `useConnect` pattern.)  _Ref: wagmi connect docs._ :contentReference[oaicite:0]{index=0}
  - **Privy-only**: authentication + wallets with Privy React SDK (`useLogin`, `usePrivy`, `useWallets`).  _Ref: Privy docs & SDK._ :contentReference[oaicite:1]{index=1}
- **Create gift**: `GiftForm` resolves **ENS → address** for sending; validate timestamp; choose ETH or token; call contract.  
- **Display names safely**: If you show an ENS name, do **reverse → forward** verification. If mismatch, show checksummed address.  _Ref: ENS reverse verification._ :contentReference[oaicite:2]{index=2}
- **View & Claim**: `GiftList` + `GiftCard` fetch IDs & details; show countdown; enable claim at unlock.

---

## 6) TDD Plan (What to Test First)

**Contract (Hardhat):**
- `createGift` (ETH): stores state, emits event; reverts on past time, zero value, zero recipient.  
- `createGiftToken` (ERC-20): allowance path; reverts on zero token/amount and insufficient balance/allowance.  
- `claimGift`: only recipient; after unlock; reverts on early/duplicate/unauthorized.

**Frontend (Vitest + Testing Library):**
- `GiftForm`: ENS happy/sad paths, timestamp validation, tx lifecycle (pending/success/fail).  
- `GiftCard`: countdown correctness, claim enable exactly at boundary, disabled states.

---

## 7) Commands & Environment

### Common Commands
```bash
# Package manager (using Bun)
bun install        # Installs dependencies
bun run dev        # Starts development server
bun run lint       # Runs the linting scripts
bun test          # Runs the test suite
bun run build     # Builds the project
bun run format    # Formats code with Prettier
bun audit         # Check for vulnerable dependencies

# Smart Contract Development (in contracts/ directory)
cd contracts
npm install       # Install Hardhat dependencies
npm run compile   # Compile smart contracts
npm run test      # Run contract tests (10 tests passing)
npm run node      # Start local Hardhat network
npm run deploy:local    # Deploy to local network
npm run deploy:sepolia  # Deploy to Sepolia testnet
npm run deploy:mainnet  # Deploy to mainnet
```

### Environment Variables Configuration

#### Required Environment Variables

```bash
# Ethereum Network Configuration
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Smart Contract Addresses
NEXT_PUBLIC_GIFTBOX_CONTRACT_ADDRESS=0x6802ec0997148cd10257c449702E900405c64cbC

# Wallet SDKs
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### Environment Variable Descriptions

- **NEXT_PUBLIC_ALCHEMY_API_KEY**: Alchemy API key for Ethereum network access
- **NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID**: WalletConnect project ID for wallet connections
- **NEXT_PUBLIC_GIFTBOX_CONTRACT_ADDRESS**: Deployed GiftBoxV2 contract address (Sepolia: `0x6802ec0997148cd10257c449702E900405c64cbC`)
- **NEXT_PUBLIC_PRIVY_APP_ID**: Privy application ID for authentication
- **NEXT_PUBLIC_APP_URL**: Base URL of your application
- **NODE_ENV**: Environment mode (development, production, test)

#### Security Notes

- Never commit actual values to version control
- Use `.env.local` for local development
- Store production secrets in secure environment variable managers
- Rotate keys regularly, especially API keys

---

## 8) Current Deployment Status

### ✅ Sepolia Testnet Deployment (LIVE) - GiftBoxV2
- **Contract Address:** `0x6802ec0997148cd10257c449702E900405c64cbC`
- **Network:** Sepolia (Chain ID: 11155111)
- **Contract Version:** GiftBoxV2 (Enhanced Multi-Asset Support)
- **Verification:** ✅ Verified on RoutesScan
- **Explorer Link:** https://testnet.routescan.io/address/0x6802ec0997148cd10257c449702E900405c64cbC/contract/11155111/writeContract?chainid=11155111

### 🧪 Enhanced Features (GiftBoxV2)
- **Multi-Asset Support:** ✅ ETH, ERC20, ERC721 (NFTs), ERC1155 tokens
- **Gas Optimization:** ✅ Enabled (200 runs)
- **Security Features:** ✅ ReentrancyGuard, SafeTransfers, Custom Errors
- **Enhanced Functionality:** ✅ Personal messages, ENS support, batch operations

### 🎯 Supported Tokens (Ready for Testing)
- **ETH:** Native Ethereum (address: `0x0000000000000000000000000000000000000000`)
- **PYUSD Mainnet:** `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
- **PYUSD Sepolia:** `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

### 📋 Next Steps
1. Update frontend constants with deployed contract address
2. Test contract functionality via frontend
3. Deploy to mainnet when ready for production

---

## 9) Wallet Pages (Snippets)

> **Generic wagmi connect** — keep it minimal and framework-idiomatic. *Ref: wagmi `useConnect`.* ([Wagmi][1])

```tsx
// src/app/connect/page.tsx
"use client";
import { useConnect } from "wagmi";

export default function Page() {
  const { connectors, connect, status, error } = useConnect();
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Connect Wallet</h1>
      <div className="grid gap-3">
        {connectors.map((c) => (
          <button key={c.uid} onClick={() => connect({ connector: c })}
            className="w-full rounded-2xl border p-3 hover:bg-gray-50">
            {c.name}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500">Status: {status}</p>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </main>
  );
}
```

> **Privy-only connect** — sign-in/connect with wallet listing. *Ref: Privy docs & SDK.* ([Privy Docs][2], [npm][3])

```tsx
// src/app/connect-privy/page.tsx
"use client";
import { useLogin, useLogout, usePrivy, useWallets } from "@privy-io/react-auth";

export default function Page() {
  const { login } = useLogin();
  const { logout } = useLogout();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Connect via Privy</h1>
      {!authenticated ? (
        <button onClick={login} className="w-full rounded-2xl border p-3 hover:bg-gray-50">
          Sign in / Connect
        </button>
      ) : (
        <>
          <ul className="space-y-2">
            {wallets.map((w) => (
              <li key={w.address} className="rounded-xl border p-3">
                <div className="font-mono text-sm">{w.address}</div>
                <div className="text-xs text-gray-500">{w.walletClientType}</div>
              </li>
            ))}
          </ul>
          <button onClick={logout} className="w-full rounded-2xl border p-3 hover:bg-gray-50">
            Disconnect
          </button>
        </>
      )}
    </main>
  );
}
```

> **Gemini-only** — prefer a native Gemini connector if present; otherwise select the WalletConnect entry that routes to Gemini. Follow wagmi’s connector UX. *Ref: wagmi connect guide.* ([Wagmi][1])

---

## 10) ENS Helpers (Safety)

* **Forward lookup for sending** (ENS → address).
* **Reverse + forward verify for display**. If mismatch, show the checksummed address. *Ref: ENS docs.* ([ENS Documentation][4])

---

## 11) Merchants (NYC)

Merchants (restaurants, cafés, matcha shops, pet stores) can also create Gifts and send to customers (promos, prepaid credit, special occasions). See **`MERCHANTS.md`** for campaign ideas, POS flow, and **NY/US gift-card compliance pointers** (e.g., NY 9-year minimum expiry; scam-warning signage). (That file holds the legal pointers; this CLAUDE.me stays technical.)

---

## 12) Coding Standards & Project Governance

### Language & Style
- **TypeScript** for all application code
- **React/Next.js** conventions for component structure
- **TailwindCSS** utility classes—no custom CSS unless absolutely necessary

### Linting & Formatting
- **ESLint** with the Airbnb + TypeScript config
- **Prettier** for code formatting
- All code must pass `bun lint` and `bun format` before merging

### Branching Strategy
- **`main`**: Production-ready code only. Protected: requires PR review and passing CI checks
- **`develop`**: Latest integrated features. Automatically deployed to staging
- **Feature Branches**: Naming: `feature/<short-description>` (e.g. `feature/webhook-auth`)
- **Release Branches**: Named `release/<version>` (e.g. `release/1.0.0`)
- **Hotfix Branches**: Named `hotfix/<issue>` (e.g. `hotfix/login-bug`)

### Pull Request & Code Review
1. **PR Requirements**:
   - Must target `develop` (unless hotfix)
   - Include a clear title, description, and link to related issue or ticket
   - List out key changes and any manual testing steps
2. **Review Process**:
   - At least **two reviewers** required
   - Reviewers check for correctness, edge cases, coding standards, security, performance
3. **CI/CD Checks**:
   - All tests must pass (`bun test`)
   - Lint and type-check must pass
   - Build must succeed (`bun build`)

### Security Best Practices
- **Secrets Management**: All secrets in environment variables. Never commit `.env` or API keys
- **Input Validation**: Sanitize all user inputs (files, text)
- **Dependency Audits**: Regularly run `bun audit`. Patch vulnerable packages within 48 hours
- **Smart Contract Security**: Use OpenZeppelin patterns & reentrancy protection

---

## 13) Planning Template — `tasks/todo.md`

```
# Plan — <feature/bug>

## TODO
- [ ] ...
- [ ] ...

## Notes / Risks
- ...

## Review
- Summary of changes:
- Tests added/updated:
- Follow-ups:
```

---

## 14) What Claude Should Avoid

* **Large, cross-cutting changes** in a single PR.
* Deleting/restructuring directories without an explicit plan reviewed by the PM.
* Skipping tests or shipping failing CI.
* Displaying ENS names without reverse-verify (spoofing risk). ([ENS Documentation][4])

---

## 15) Useful References

* **wagmi — connect wallet pattern & `useConnect` docs**. ([Wagmi Documentation](https://wagmi.sh/react/guides/connect-wallet))
* **Privy — React SDK & hooks (`useLogin`, `usePrivy`, `useWallets`)**. ([Privy Docs](https://docs.privy.io/), [npm package](https://www.npmjs.com/package/@privy-io/react-auth))
* **ENS — reverse resolution & forward verification** (display safety). ([ENS Documentation](https://docs.ens.domains/web/reverse))
* **Claude Code — agentic coding best practices** (planning, small steps, memory hygiene). ([Anthropic Engineering Blog](https://www.anthropic.com/engineering/claude-code-best-practices))

---

*Last updated: 2025-08-16*
*EchoBox: Time-locked crypto gifts via ENS names*
*✅ GiftBoxV2 Deployed & Verified on Sepolia: `0x6802ec0997148cd10257c449702E900405c64cbC`*
*Powered by Claude 4 Sonnet*
