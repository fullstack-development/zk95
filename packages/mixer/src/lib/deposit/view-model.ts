import { Property, newAtom } from '@frp-ts/core';
import { injectable, makeModule, token } from '@mixer/react-injectable';
import {
  CONNECT_WALLET_KEY,
  ConnectWalletViewModel,
} from '@mixer/wallet-connect';

export type DepositViewModel = {
  poolSize$: Property<number>;
  setPoolSize: (size: number) => void;
};

export const DEPOSIT_KEY = 'depositViewModel';
export const mkDepositViewModel = injectable(
  DEPOSIT_KEY,
  token(CONNECT_WALLET_KEY)<ConnectWalletViewModel>(),
  (connectWallet) => {
    const poolSize$ = newAtom<number>(10);

    return makeModule(
      {
        poolSize$,
        setPoolSize: poolSize$.set,
      },
      Promise.resolve().then(() => console.log('effect'))
    );
  }
);
