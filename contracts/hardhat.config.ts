import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.ALCHEMY_API_KEY
        ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : "https://eth-sepolia.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
    mainnet: {
      url: process.env.ALCHEMY_API_KEY
        ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : "https://eth-mainnet.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;
