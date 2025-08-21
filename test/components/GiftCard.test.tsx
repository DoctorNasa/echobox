import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GiftCard } from '../../components/GiftCard';
import { GiftStatus } from '../../types/gift';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('GiftCard', () => {
  const mockGift = {
    id: '1',
    sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
    recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
    recipientENS: 'test.eth',
    message: 'Happy Birthday!',
    asset: {
      type: 'eth',
      symbol: 'ETH',
      amount: '1.5',
      address: '0x0000000000000000000000000000000000000000',
    },
    unlockTimestamp: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
    status: GiftStatus.PENDING,
    createdAt: new Date().toISOString(),
  };

  const mockOnClaim = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render gift card with basic information', () => {
    render(
      <GiftCard
        gift={mockGift}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText('Happy Birthday!')).toBeInTheDocument();
    expect(screen.getByText('1.5 ETH')).toBeInTheDocument();
    expect(screen.getByText('test.eth')).toBeInTheDocument();
  });

  it('should show pending status for locked gifts', () => {
    render(
      <GiftCard
        gift={mockGift}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.queryByText('Claim Gift')).not.toBeInTheDocument();
  });

  it('should show claim button for claimable gifts', () => {
    const claimableGift = {
      ...mockGift,
      status: GiftStatus.CLAIMABLE,
      unlockTimestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    };

    render(
      <GiftCard
        gift={claimableGift}
        onClaim={mockOnClaim}
        isClaimable={true}
        isClaiming={false}
      />
    );

    expect(screen.getByText('Ready to Claim')).toBeInTheDocument();
    expect(screen.getByText('Claim Gift')).toBeInTheDocument();
  });

  it('should call onClaim when claim button is clicked', async () => {
    const claimableGift = {
      ...mockGift,
      status: GiftStatus.CLAIMABLE,
    };

    render(
      <GiftCard
        gift={claimableGift}
        onClaim={mockOnClaim}
        isClaimable={true}
        isClaiming={false}
      />
    );

    const claimButton = screen.getByText('Claim Gift');
    fireEvent.click(claimButton);

    await waitFor(() => {
      expect(mockOnClaim).toHaveBeenCalledWith('1');
    });
  });

  it('should show loading state when claiming', () => {
    const claimableGift = {
      ...mockGift,
      status: GiftStatus.CLAIMABLE,
    };

    render(
      <GiftCard
        gift={claimableGift}
        onClaim={mockOnClaim}
        isClaimable={true}
        isClaiming={true}
      />
    );

    expect(screen.getByText('Claiming...')).toBeInTheDocument();
    expect(screen.getByText('Claiming...')).toBeDisabled();
  });

  it('should show claimed status for claimed gifts', () => {
    const claimedGift = {
      ...mockGift,
      status: GiftStatus.CLAIMED,
      claimedAt: new Date().toISOString(),
    };

    render(
      <GiftCard
        gift={claimedGift}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText('Claimed')).toBeInTheDocument();
    expect(screen.queryByText('Claim Gift')).not.toBeInTheDocument();
  });

  it('should display ENS name when available', () => {
    render(
      <GiftCard
        gift={mockGift}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText('test.eth')).toBeInTheDocument();
  });

  it('should display truncated address when ENS is not available', () => {
    const giftWithoutENS = {
      ...mockGift,
      recipientENS: '',
    };

    render(
      <GiftCard
        gift={giftWithoutENS}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    // Should show truncated address
    expect(screen.getByText(/0x456d35...890456/)).toBeInTheDocument();
  });

  it('should handle different asset types correctly', () => {
    const erc20Gift = {
      ...mockGift,
      asset: {
        type: 'erc20',
        symbol: 'USDC',
        amount: '100.50',
        address: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
      },
    };

    render(
      <GiftCard
        gift={erc20Gift}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText('100.50 USDC')).toBeInTheDocument();
  });

  it('should handle NFT gifts correctly', () => {
    const nftGift = {
      ...mockGift,
      asset: {
        type: 'erc721',
        symbol: 'NFT #42',
        amount: '1',
        address: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
      },
    };

    render(
      <GiftCard
        gift={nftGift}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText('NFT #42')).toBeInTheDocument();
  });

  it('should show time remaining for pending gifts', () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
    const pendingGift = {
      ...mockGift,
      unlockTimestamp: futureTimestamp,
    };

    render(
      <GiftCard
        gift={pendingGift}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    // Should show some time remaining (exact format may vary)
    expect(screen.getByText(/\d+[dhm]/)).toBeInTheDocument();
  });

  it('should not show claim button when showClaimButton is false', () => {
    const claimableGift = {
      ...mockGift,
      status: GiftStatus.CLAIMABLE,
    };

    render(
      <GiftCard
        gift={claimableGift}
        onClaim={mockOnClaim}
        isClaimable={true}
        isClaiming={false}
        showClaimButton={false}
      />
    );

    expect(screen.queryByText('Claim Gift')).not.toBeInTheDocument();
  });

  it('should handle long messages gracefully', () => {
    const longMessageGift = {
      ...mockGift,
      message: 'This is a very long message that should be handled gracefully by the component and not break the layout or cause any issues with the display of the gift card.',
    };

    render(
      <GiftCard
        gift={longMessageGift}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText(longMessageGift.message)).toBeInTheDocument();
  });

  it('should apply correct status styling', () => {
    const { rerender } = render(
      <GiftCard
        gift={{ ...mockGift, status: GiftStatus.PENDING }}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();

    rerender(
      <GiftCard
        gift={{ ...mockGift, status: GiftStatus.CLAIMABLE }}
        onClaim={mockOnClaim}
        isClaimable={true}
        isClaiming={false}
      />
    );

    expect(screen.getByText('Ready to Claim')).toBeInTheDocument();

    rerender(
      <GiftCard
        gift={{ ...mockGift, status: GiftStatus.CLAIMED }}
        onClaim={mockOnClaim}
        isClaimable={false}
        isClaiming={false}
      />
    );

    expect(screen.getByText('Claimed')).toBeInTheDocument();
  });
});
