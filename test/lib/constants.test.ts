import { describe, it, expect } from 'vitest';
import { 
  getTokenListForChain, 
  MAINNET_TOKEN_LIST, 
  SEPOLIA_TOKEN_LIST,
  MAINNET_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
  PYUSD_ADDRESS_MAINNET,
  PYUSD_ADDRESS_SEPOLIA
} from '../../src/lib/constants';

describe('Token Configuration', () => {
  describe('getTokenListForChain', () => {
    it('should return mainnet tokens for mainnet chain ID', () => {
      const tokens = getTokenListForChain(MAINNET_CHAIN_ID);
      expect(tokens).toEqual(MAINNET_TOKEN_LIST);
      
      // Check that PYUSD has the correct mainnet address
      const pyusd = tokens.find(t => t.symbol === 'PYUSD');
      expect(pyusd).toBeDefined();
      expect(pyusd?.address).toBe(PYUSD_ADDRESS_MAINNET);
    });

    it('should return sepolia tokens for sepolia chain ID', () => {
      const tokens = getTokenListForChain(SEPOLIA_CHAIN_ID);
      expect(tokens).toEqual(SEPOLIA_TOKEN_LIST);
      
      // Check that PYUSD has the correct sepolia address
      const pyusd = tokens.find(t => t.symbol === 'PYUSD');
      expect(pyusd).toBeDefined();
      expect(pyusd?.address).toBe(PYUSD_ADDRESS_SEPOLIA);
    });

    it('should default to mainnet tokens for unknown chain ID', () => {
      const tokens = getTokenListForChain(999999);
      expect(tokens).toEqual(MAINNET_TOKEN_LIST);
    });
  });

  describe('PYUSD Configuration', () => {
    it('should have correct mainnet PYUSD address', () => {
      expect(PYUSD_ADDRESS_MAINNET).toBe('0x6c3ea9036406852006290770BEdFcAbA0e23A0e8');
    });

    it('should have PYUSD in both mainnet and sepolia token lists', () => {
      const mainnetPyusd = MAINNET_TOKEN_LIST.find(t => t.symbol === 'PYUSD');
      const sepoliaPyusd = SEPOLIA_TOKEN_LIST.find(t => t.symbol === 'PYUSD');
      
      expect(mainnetPyusd).toBeDefined();
      expect(sepoliaPyusd).toBeDefined();
      
      expect(mainnetPyusd?.decimals).toBe(6);
      expect(sepoliaPyusd?.decimals).toBe(6);
      
      expect(mainnetPyusd?.name).toBe('PayPal USD');
      expect(sepoliaPyusd?.name).toBe('PayPal USD');
    });

    it('should have correct PYUSD addresses for both networks', () => {
      const mainnetPyusd = MAINNET_TOKEN_LIST.find(t => t.symbol === 'PYUSD');
      const sepoliaPyusd = SEPOLIA_TOKEN_LIST.find(t => t.symbol === 'PYUSD');

      expect(mainnetPyusd?.address).toBe(PYUSD_ADDRESS_MAINNET);
      expect(sepoliaPyusd?.address).toBe(PYUSD_ADDRESS_SEPOLIA);

      // Should use different addresses for different networks
      expect(mainnetPyusd?.address).toBe('0x6c3ea9036406852006290770BEdFcAbA0e23A0e8');
      expect(sepoliaPyusd?.address).toBe('0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9');
    });
  });

  describe('Token List Structure', () => {
    it('should have ETH as the first token in both lists', () => {
      expect(MAINNET_TOKEN_LIST[0].symbol).toBe('ETH');
      expect(SEPOLIA_TOKEN_LIST[0].symbol).toBe('ETH');
      expect(MAINNET_TOKEN_LIST[0].address).toBeNull();
      expect(SEPOLIA_TOKEN_LIST[0].address).toBeNull();
    });

    it('should have all required tokens in both lists', () => {
      const requiredTokens = ['ETH', 'PYUSD', 'USDC', 'WETH', 'DAI'];
      
      for (const symbol of requiredTokens) {
        const mainnetToken = MAINNET_TOKEN_LIST.find(t => t.symbol === symbol);
        const sepoliaToken = SEPOLIA_TOKEN_LIST.find(t => t.symbol === symbol);
        
        expect(mainnetToken, `${symbol} should exist in mainnet list`).toBeDefined();
        expect(sepoliaToken, `${symbol} should exist in sepolia list`).toBeDefined();
      }
    });
  });
});
