import { EMPTY, filter, first, from, map, mergeMap, of, switchMap } from 'rxjs';
import { newAtom, Property } from '@frp-ts/core';
import { WalletApi, Cardano, C, fromHex } from 'lucid-cardano';

import { injectable } from '@mixer/injectable';
import { fromObservable } from '@mixer/utils';
import { withEff } from '@mixer/eff';
import { SUPPORTED_WALLETS, WalletKey } from './supported-wallets';

export type WalletInfo = Pick<
  Cardano[string],
  'apiVersion' | 'icon' | 'name'
> & { key: WalletKey };

export type WalletService = {
  wallet$: Property<{ api: WalletApi; info: WalletInfo } | null>;
  adaBalance$: Property<bigint>;
  address$: Property<string | null>;
  supportedWallets: typeof SUPPORTED_WALLETS;
  installedWallets: Partial<Record<WalletKey, WalletInfo>>;
  connectWallet: (walletKey: WalletKey) => Promise<void>;
};

export const mkWalletService = injectable(() => {
  const wallet$ = newAtom<{ api: WalletApi; info: WalletInfo } | null>(null);

  const adaBalance$ = from(wallet$).pipe(
    switchMap((wallet) =>
      wallet
        ? from(wallet.api.getBalance()).pipe(
            map((lovelace) => deserializeValue(lovelace) / BigInt(1000000))
          )
        : of(BigInt(0))
    )
  );

  const address$ = from(wallet$).pipe(
    switchMap(
      (wallet) =>
        wallet?.api.getUsedAddresses().then(([addr]) => addr) ?? of(null)
    )
  );

  const connectWallet = async (key: WalletKey) => {
    if (window.cardano === undefined) return;

    const installedWallets = getInstalledWallets();
    const info = installedWallets[key];

    if (info) {
      try {
        const api = await window.cardano[key].enable();

        if (api.getCollateral === undefined) {
          api.getCollateral = api.experimental.getCollateral;
        }

        wallet$.set({ api, info });
      } catch (error) {
        console.log(error);
      }
    }
  };

  const getInstalledWallets = (): Partial<Record<WalletKey, WalletInfo>> => {
    if (window.cardano === undefined) return {};

    return SUPPORTED_WALLETS.filter(
      ([key]) => window.cardano[key] !== undefined
    ).reduce<Partial<Record<WalletKey, WalletInfo>>>(
      (acc, [key, name, , icon]) => {
        acc[key] = {
          key,
          name,
          icon,
          apiVersion: window.cardano[key].apiVersion,
        };
        return acc;
      },
      {}
    );
  };

  const connectEnabledWalletEffect$ = from(SUPPORTED_WALLETS).pipe(
    mergeMap(([key]) =>
      window?.cardano?.[key]
        ? from(
            window.cardano[key]
              .isEnabled()
              .then((enabled) => (enabled ? key : undefined))
          )
        : EMPTY
    ),
    filter((key): key is WalletKey => !!key),
    first(null, null),
    switchMap((key) => (key ? connectWallet(key) : EMPTY))
  );

  function deserializeValue(value: string): bigint {
    return BigInt(C.Value.from_bytes(fromHex(value)).coin().to_str());
  }

  return withEff<WalletService>(
    {
      wallet$,
      adaBalance$: fromObservable(adaBalance$, BigInt(0)),
      address$: fromObservable(address$, null),
      supportedWallets: SUPPORTED_WALLETS,
      installedWallets: getInstalledWallets(),
      connectWallet,
    },
    connectEnabledWalletEffect$
  );
});
