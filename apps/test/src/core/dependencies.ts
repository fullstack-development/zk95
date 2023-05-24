import { mkConnectWalletViewModel } from '@mixer/wallet-connect';

export const deps = (() => {
  const walletConnect = mkConnectWalletViewModel();
  return {
    walletConnect,
  };
})();
