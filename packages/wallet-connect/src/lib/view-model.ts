import {
  EMPTY,
  NEVER,
  combineLatest,
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

import {
  ViewModel,
  fromObservable,
  mapProperty,
  mkViewModel,
} from '@mixer/utils';

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
  address$: Property<string | null>;
  availableWallets$: Property<Wallet[]>;
  connectWallet: (walletName: string) => void;
};

export const mkConnectWalletViewModel =
  (): ViewModel<ConnectWalletViewModel> => {
    const wallet$ = newAtom<{ api: BrowserWallet; info: Wallet } | null>(null);

    const installedWallets$ = defer(() =>
      of(BrowserWallet.getInstalledWallets())
    );

    const connectEnabledWalletEffect$ = from(
      SUPPORTED_WALLETS.map((w) =>
        window.cardano[w]
          ? from(
              window.cardano[w]
                .isEnabled()
                .then((enabled) => (enabled ? window.cardano[w] : undefined))
            )
          : EMPTY
      )
    ).pipe(
      mergeAll(),
      filter((w): w is (typeof window.cardano)[string] => !!w),
      first(null, null),
      switchMap((wallet) =>
        wallet?.name
          ? from(BrowserWallet.enable(wallet.name)).pipe(
              tap((api) => wallet$.set({ api, info: wallet }))
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
        const api = await BrowserWallet.enable(name);
        wallet$.set({ api, info });
      }
    };

    return mkViewModel(
      {
        wallet$,
        address$: fromObservable(address$, null),
        availableWallets$: fromObservable(
          defer(() => of(BrowserWallet.getInstalledWallets())),
          []
        ),
        connectWallet,
      },
      connectEnabledWalletEffect$
    );
  };
