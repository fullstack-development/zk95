import { mkViewModel as mkWalletConnectVM } from '@mixer/wallet-connect';

export type Dependencies = {};

export const deps = (() => {
  const walletConnect = mkWalletConnectVM();
  return {
    walletConnect,
  };
})();
