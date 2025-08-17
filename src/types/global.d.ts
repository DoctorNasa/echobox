// Global type declarations

interface Window {
  Privy?: {
    login: () => void;
    logout: () => void;
    authenticated: boolean;
    user?: {
      id: string;
      email?: {
        address: string;
      };
      wallet?: {
        address: string;
        chainId: number;
      };
    };
  };
  ethereum?: {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    isWalletConnect?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
  };
}
