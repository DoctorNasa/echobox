export type AssetType = "ETH" | "ERC20" | "ERC721" | "ERC1155";

export type TokenMeta = {
  symbol: string;
  name?: string;
  address: `0x${string}` | null;   // null for ETH
  decimals?: number;                // ETH/ERC20
  icon?: string;                    // /tokens/<symbol>.svg
  chainId?: number;
};

export type NFTInput = {
  standard: "ERC721" | "ERC1155";
  address: `0x${string}`;
  tokenId: string;  // as string; cast to bigint when calling
  amount?: string;  // ERC1155 only
  name?: string;    // Optional NFT collection name
  symbol?: string;  // Optional NFT symbol
};

export type SelectedAsset = {
  type: AssetType;
  token?: TokenMeta;
  nft?: NFTInput;
  amount?: string;
};

export type GiftAsset = {
  id: bigint;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  unlockTimestamp: bigint;
  claimed: boolean;
  assetType: AssetType;
  token: `0x${string}`;
  tokenId: bigint;
  amount: bigint;
  recipientENS: string;
  message: string;
};
