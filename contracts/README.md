# EchoBox Smart Contracts

This directory contains the smart contracts for EchoBox - a decentralized application for sending time-locked crypto gifts via ENS names.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Fill in your environment variables in `.env`:
- `ALCHEMY_API_KEY`: Your Alchemy API key for RPC connections
- `PRIVATE_KEY`: Your private key for deployment (without 0x prefix)
- `ETHERSCAN_API_KEY`: Your Etherscan API key for contract verification

## Available Scripts

### Compilation
```bash
npm run compile
```

### Testing
```bash
npm run test
```

### Local Development
Start a local Hardhat node:
```bash
npm run node
```

Deploy to local network:
```bash
npx hardhat run scripts/deploy-local.ts --network localhost
```

### Deployment

Deploy to Sepolia testnet:
```bash
npm run deploy:sepolia
```

Deploy to Ethereum mainnet:
```bash
npm run deploy:mainnet
```

### Verification

Verify contract on Sepolia:
```bash
npm run verify:sepolia <CONTRACT_ADDRESS>
```

Verify contract on mainnet:
```bash
npm run verify:mainnet <CONTRACT_ADDRESS>
```

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

[book.getv2.hardhat.sh/](https://v2.hardhat.org/docs)

## Usage

### Build

```shell

```

### Test

```shell
```
### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell

```
