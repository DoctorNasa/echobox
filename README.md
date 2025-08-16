# 🎁 EchoBox - Time-Locked Crypto Gifts

> Send crypto gifts that unlock in the future, addressed by **ENS** names.

A decentralized application for sending time-locked cryptocurrency gifts for birthdays, holidays, and special milestones. Built with Next.js, TypeScript, and Solidity.

## ✨ Features

- 🔒 **Time-Locked Gifts** - Send crypto that unlocks at a specific future date
- 🏷️ **ENS Integration** - Send gifts using ENS names instead of wallet addresses
- 💰 **Multi-Token Support** - Support for ETH and ERC-20 tokens (PYUSD)
- 💌 **Personal Messages** - Include heartfelt messages with your gifts
- 🔍 **Gift Tracking** - Track sent and received gifts by address or ENS name
- 🛡️ **Security First** - Reentrancy protection and comprehensive testing

## 🚀 Live Deployment

**✅ Smart Contract Deployed on Sepolia Testnet**
- **Contract Address:** `0x41F3cAb3eAa961478CC19008deb8AC615d07d642`
- **Etherscan:** [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x41F3cAb3eAa961478CC19008deb8AC615d07d642#code)
- **Status:** Verified and ready for testing

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Blockchain:** Ethereum, Solidity, Hardhat
- **Wallet Integration:** wagmi, viem, Privy
- **Testing:** Vitest, Hardhat Test Suite
- **Package Manager:** Bun
- **Icons:** Lucide React

## 🏗️ Project Structure

```
EchoBox/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   └── types/               # TypeScript type definitions
├── contracts/
│   ├── contracts/           # Solidity smart contracts
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── hardhat.config.ts    # Hardhat configuration
├── public/                  # Static assets
└── docs/                    # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or later
- Bun package manager
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/EchoBox.git
cd EchoBox
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_GIFTBOX_CONTRACT_ADDRESS=0x41F3cAb3eAa961478CC19008deb8AC615d07d642
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

4. **Start the development server**
```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Smart Contract Development

### Setup

1. **Navigate to contracts directory**
```bash
cd contracts
```

2. **Install contract dependencies**
```bash
npm install
```

3. **Set up contract environment**
```bash
cp .env.example .env
```

### Available Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Start local Hardhat network
npm run node

# Deploy to local network
npm run deploy:local

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to mainnet
npm run deploy:mainnet
```

## 🧪 Testing

### Frontend Tests
```bash
bun test              # Run all tests
bun test:watch        # Run tests in watch mode
bun test:coverage     # Run tests with coverage
```

### Smart Contract Tests
```bash
cd contracts
npm run test          # Run contract tests (10 tests passing)
REPORT_GAS=true npm run test  # Run with gas reporting
```

## 📝 Usage

### Creating a Gift

1. **Connect your wallet** using any supported wallet provider
2. **Enter recipient details** - Use ENS name or wallet address
3. **Choose token and amount** - ETH or supported ERC-20 tokens
4. **Set unlock date** - When the recipient can claim the gift
5. **Add a personal message** - Make it special!
6. **Send the gift** - Transaction will be processed on-chain

### Claiming a Gift

1. **Connect your wallet** as the recipient
2. **View your received gifts** in the dashboard
3. **Wait for unlock time** - Gifts can only be claimed after the unlock date
4. **Claim your gift** - Receive the tokens and read the message

## 🔐 Security

- **Reentrancy Protection** - All state-changing functions are protected
- **Access Control** - Only recipients can claim their gifts
- **Time Validation** - Gifts cannot be claimed before unlock time
- **Safe Transfers** - Using OpenZeppelin's SafeERC20 for token transfers
- **Comprehensive Testing** - 10 test cases covering all scenarios

## 🌐 Supported Networks

- **Ethereum Mainnet** (Production)
- **Sepolia Testnet** (Testing) ✅ Currently deployed

## 💰 Supported Tokens

- **ETH** - Native Ethereum
- **PYUSD** - PayPal USD (Mainnet & Sepolia)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for ETH Global NYC 2024
- Powered by Ethereum and the amazing DeFi ecosystem
- Special thanks to the ENS, Hardhat, and Next.js communities

## 📞 Support

- **Documentation:** [CLAUDE.md](CLAUDE.md) - Comprehensive development guide
- **Issues:** [GitHub Issues](https://github.com/your-username/EchoBox/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/EchoBox/discussions)

---

**Made with ❤️ for the Ethereum community**
