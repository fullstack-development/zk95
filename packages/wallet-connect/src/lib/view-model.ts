import { Observable, defer, from, map, of, switchMap, tap } from 'rxjs';
import { combine, newAtom, Property } from '@frp-ts/core';
import { Wallet, BrowserWallet } from '@meshsdk/core';

import { fromObservable } from '@mixer/utils';

export type ViewModel = {
  address$: Property<string | null>;
  installedWallets$: Property<Wallet[]>;
  connectWallet: (walletName: string) => void;
};

export const mkViewModel = (): ViewModel => {
  const wallet$ = newAtom<BrowserWallet | null>(null);

  const installedWallets$ = fromObservable<Wallet[]>(
    defer(() => of(BrowserWallet.getInstalledWallets())),
    []
  );

  const address$ = fromObservable<string | null>(
    from(wallet$).pipe(
      switchMap(
        (wallet) =>
          wallet?.getUsedAddress().then((addr) => addr.to_js_value()) ??
          of(null)
      )
    ),
    null
  );

  const connectWallet = async (walletName: string) => {
    const wallet = await BrowserWallet.enable(walletName);
    wallet$.set(wallet);
  };

  return {
    address$,
    installedWallets$,
    connectWallet,
  };
};
