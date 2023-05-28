import {
  EMPTY,
  NEVER,
  defer,
  filter,
  first,
  from,
  map,
  mergeAll,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { newAtom, Property } from '@frp-ts/core';
import { Wallet, BrowserWallet } from '@meshsdk/core';
import { injectable } from '@mixer/injectable';

import { fromObservable, makeViewModel } from '@mixer/utils';

const SUPPORTED_WALLETS = [
  'begin',
  'eternl',
  'flint',
  'lace',
  'nami',
  'nufi',
  'gerowallet',
  'typhoncip30',
];

export type ConnectWalletViewModel = {
  wallet$: Property<{ api: BrowserWallet; info: Wallet } | null>;
  adaBalance$: Property<number>;
  address$: Property<string | null>;
  availableWallets$: Property<Wallet[]>;
  connectWallet: (walletName: string) => void;
};

export const mkConnectWalletViewModel = injectable(() => {
  const wallet$ = newAtom<{ api: BrowserWallet; info: Wallet } | null>(null);

  const adaBalance$ = from(wallet$).pipe(
    switchMap((wallet) =>
      wallet
        ? from(wallet.api.getLovelace()).pipe(
            map((lovelace) => Number(lovelace) / 1000000)
          )
        : of(0)
    )
  );

  const connectEnabledWalletEffect$ = from(
    SUPPORTED_WALLETS.map((w) =>
      window?.cardano[w]
        ? from(
            window?.cardano[w]
              .isEnabled()
              .then((enabled) => (enabled ? window?.cardano[w] : undefined))
          )
        : EMPTY
    )
  ).pipe(
    mergeAll(),
    filter((w): w is (typeof window.cardano)[string] => !!w),
    first(null, null),
    switchMap((wallet) =>
      wallet
        ? from(BrowserWallet.enable(wallet.name)).pipe(
            tap((api) =>
              wallet$.set({
                api,
                info: {
                  name: wallet.name,
                  icon: wallet.icon,
                  version: wallet.apiVersion,
                },
              })
            )
          )
        : NEVER
    )
  );

  const address$ = from(wallet$).pipe(
    switchMap(
      (wallet) =>
        wallet?.api.getUsedAddress().then((addr) => addr.to_js_value()) ??
        of(null)
    )
  );

  const connectWallet = async (name: string) => {
    const installedWallets = BrowserWallet.getInstalledWallets();
    const info = installedWallets.find((w) => w.name === name);

    if (info) {
      try {
        const api = await BrowserWallet.enable(name);
        wallet$.set({ api, info });
      } catch (error) {
        console.log(error);
      }
    }
  };

  return makeViewModel<ConnectWalletViewModel>(
    {
      wallet$,
      adaBalance$: fromObservable(adaBalance$, 0),
      address$: fromObservable(address$, null),
      availableWallets$: fromObservable(
        defer(() => of(BrowserWallet.getInstalledWallets())),
        []
      ),
      connectWallet,
    },
    connectEnabledWalletEffect$
  );
});
