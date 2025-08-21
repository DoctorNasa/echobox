import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletAssetSelector } from '../../src/components/WalletAssetSelector';
import { useAccount } from 'wagmi';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useBalance: vi.fn(),
}));

// Mock wallet assets hook
vi.mock('../../src/hooks/useWalletAssets', () => ({
  useWalletAssets: vi.fn(() => ({
    assets: {
      native: { balance: '1000000000000000000', symbol: 'ETH', decimals: 18 },
      erc20: [
        { address: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9', symbol: 'PYUSD', balance: '1000000', decimals: 6 }
      ]
    },
    isLoading: false
  }))
}));

// Mock wallet NFTs hook
vi.mock('../../src/hooks/useWalletNFTs', () => ({
  useWalletNFTs: vi.fn(() => ({
    nfts: [
      {
        id: 'test-nft-1',
        name: 'Test NFT #1',
        tokenId: '123',
        image: 'https://example.com/nft1.png',
        collection: {
          name: 'Test Collection',
          address: '0x1234567890123456789012345678901234567890'
        }
      }
    ],
    loading: false,
    error: null
  }))
}));

describe('WalletAssetSelector', () => {
  const mockOnAssetSelect = vi.fn();
  const mockOnBulkUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAccount as any).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true
    });
  });

  it('should render NFT tab when wallet is connected', () => {
    render(
      <WalletAssetSelector 
        onAssetSelect={mockOnAssetSelect}
        onBulkUpload={mockOnBulkUpload}
      />
    );
    
    expect(screen.getByText('Tokens')).toBeInTheDocument();
    expect(screen.getByText('NFTs')).toBeInTheDocument();
  });

  it('should switch to NFT tab and show NFTs', () => {
    render(
      <WalletAssetSelector 
        onAssetSelect={mockOnAssetSelect}
        onBulkUpload={mockOnBulkUpload}
      />
    );
    
    // Click on NFTs tab
    const nftTab = screen.getByText('NFTs');
    fireEvent.click(nftTab);
    
    // Should show NFT content
    expect(screen.getByText('Test NFT #1')).toBeInTheDocument();
    expect(screen.getByText('Test Collection')).toBeInTheDocument();
  });

  it('should call onAssetSelect when NFT is selected', () => {
    render(
      <WalletAssetSelector 
        onAssetSelect={mockOnAssetSelect}
        onBulkUpload={mockOnBulkUpload}
      />
    );
    
    // Switch to NFT tab
    fireEvent.click(screen.getByText('NFTs'));
    
    // Click on NFT
    const nftButton = screen.getByText('Test NFT #1').closest('button');
    fireEvent.click(nftButton!);
    
    // Should call onAssetSelect with NFT data
    expect(mockOnAssetSelect).toHaveBeenCalledWith({
      type: 'NFT',
      id: 'test-nft-1',
      name: 'Test NFT #1',
      tokenId: '123',
      image: 'https://example.com/nft1.png',
      collection: {
        name: 'Test Collection',
        address: '0x1234567890123456789012345678901234567890'
      },
      contractAddress: '0x1234567890123456789012345678901234567890'
    });
  });

  it('should show PYUSD token in tokens tab', () => {
    render(
      <WalletAssetSelector 
        onAssetSelect={mockOnAssetSelect}
        onBulkUpload={mockOnBulkUpload}
      />
    );
    
    // Should show PYUSD token
    expect(screen.getByText('PYUSD')).toBeInTheDocument();
    expect(screen.getByText('1.000000')).toBeInTheDocument(); // 1000000 / 10^6
  });

  it('should show wallet connection prompt when not connected', () => {
    (useAccount as any).mockReturnValue({
      address: undefined,
      isConnected: false
    });

    render(
      <WalletAssetSelector 
        onAssetSelect={mockOnAssetSelect}
        onBulkUpload={mockOnBulkUpload}
      />
    );
    
    expect(screen.getByText('Connect your wallet to see your asset balances')).toBeInTheDocument();
  });

  it('should not show "coming soon" message anywhere', () => {
    render(
      <WalletAssetSelector 
        onAssetSelect={mockOnAssetSelect}
        onBulkUpload={mockOnBulkUpload}
      />
    );
    
    // Check that "coming soon" text is not present in our component
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Coming Soon/)).not.toBeInTheDocument();
  });
});
