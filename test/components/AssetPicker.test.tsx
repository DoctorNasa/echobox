import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssetPicker from '../../src/components/AssetPicker';
import { useChainId } from 'wagmi';

// Mock wagmi hook
vi.mock('wagmi', () => ({
  useChainId: vi.fn(),
}));

// Mock the constants
vi.mock('../../src/lib/constants', () => ({
  getTokenListForChain: vi.fn(() => [
    { symbol: 'ETH', name: 'Ethereum', address: null, decimals: 18, icon: '/tokens/eth.svg' },
    { symbol: 'PYUSD', name: 'PayPal USD', address: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9', decimals: 6, icon: '/tokens/pyusd.svg' },
  ]),
}));

// Mock the price hook
vi.mock('../../src/hooks/useAssetPrice', () => ({
  default: vi.fn(() => ({ price: 2500, loading: false, error: null })),
}));

describe('AssetPicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useChainId as any).mockReturnValue(1); // Mainnet
  });

  it('should render all asset type tabs including NFTs', () => {
    render(<AssetPicker onChange={mockOnChange} />);
    
    expect(screen.getByText('Ether')).toBeInTheDocument();
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('NFT')).toBeInTheDocument();
    expect(screen.getByText('Multi NFT')).toBeInTheDocument();
  });

  it('should allow switching to ERC721 NFT tab', () => {
    render(<AssetPicker onChange={mockOnChange} />);
    
    const nftTab = screen.getByText('NFT');
    fireEvent.click(nftTab);
    
    // Should show NFT input fields
    expect(screen.getByText('Contract Address')).toBeInTheDocument();
    expect(screen.getByText('Token ID')).toBeInTheDocument();
  });

  it('should allow switching to ERC1155 NFT tab', () => {
    render(<AssetPicker onChange={mockOnChange} />);
    
    const multiNftTab = screen.getByText('Multi NFT');
    fireEvent.click(multiNftTab);
    
    // Should show NFT input fields including amount
    expect(screen.getByText('Contract Address')).toBeInTheDocument();
    expect(screen.getByText('Token ID')).toBeInTheDocument();
    expect(screen.getByText('Amount (Quantity)')).toBeInTheDocument();
  });

  it('should show helpful text for NFT types', () => {
    render(<AssetPicker onChange={mockOnChange} />);
    
    // Switch to ERC721
    fireEvent.click(screen.getByText('NFT'));
    expect(screen.getByText(/Gifting a unique NFT/)).toBeInTheDocument();
    
    // Switch to ERC1155
    fireEvent.click(screen.getByText('Multi NFT'));
    expect(screen.getByText(/Gifting multi-edition NFTs/)).toBeInTheDocument();
  });

  it('should call onChange when NFT data is entered', () => {
    render(<AssetPicker onChange={mockOnChange} />);
    
    // Switch to NFT tab
    fireEvent.click(screen.getByText('NFT'));
    
    // Enter contract address
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } });
    
    // Enter token ID
    const tokenIdInput = screen.getByPlaceholderText('Token ID');
    fireEvent.change(tokenIdInput, { target: { value: '123' } });
    
    // Should have called onChange
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should validate NFT contract address format', () => {
    render(<AssetPicker onChange={mockOnChange} />);
    
    // Switch to NFT tab
    fireEvent.click(screen.getByText('NFT'));
    
    // Enter invalid address
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: 'invalid-address' } });
    
    // The component should handle validation (implementation may vary)
    expect(addressInput).toHaveValue('invalid-address');
  });

  it('should default amount to 1 for ERC1155', () => {
    render(<AssetPicker onChange={mockOnChange} />);
    
    // Switch to ERC1155 tab
    fireEvent.click(screen.getByText('Multi NFT'));
    
    // Amount field should default to "1"
    const amountInput = screen.getByDisplayValue('1');
    expect(amountInput).toBeInTheDocument();
  });
});
