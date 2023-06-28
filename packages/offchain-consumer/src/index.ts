import {
  combineLatest,
  first,
  map,
  shareReplay,
  switchMap,
  Observable,
} from 'rxjs';
import { Lucid, TxHash } from 'lucid-cardano';

import { chainIndexProvider } from '@mixer/chain-index-provider';
import { injectable, token } from '@mixer/injectable';
import { combineEff } from '@mixer/eff';
import { mkWalletModel } from '@mixer/wallet';
import { PoolInfo, POOLS_CONFIG_KEY, deposit } from '@mixer/offchain';

import { mkProviderAdapter } from './provider/adapter';

export type Offchain = {
  deposit$: (
    poolSize: number,
    commitmentHash: Uint8Array
  ) => Observable<TxHash>;
  withdraw$: (note: string, address: string) => Observable<TxHash>;
};

export const mkOffchainConsumer = injectable(
  token(POOLS_CONFIG_KEY)<Record<number, PoolInfo>>(),
  mkWalletModel,
  chainIndexProvider,
  combineEff((poolsConfig, walletModel, provider): Offchain => {
    const lucidProvider = mkProviderAdapter(provider);

    const lucid$ = combineLatest([
      Lucid.new(lucidProvider, 'Preprod'),
      walletModel.wallet$,
    ]).pipe(
      map(([lucid, wallet]) =>
        wallet ? lucid.selectWallet(wallet.api) : lucid
      ),
      shareReplay(1)
    );

    const deposit$ = (poolSize: number, commitmentHash: Uint8Array) =>
      lucid$.pipe(
        first(),
        switchMap((lucid) =>
          deposit(lucid, poolsConfig[poolSize], commitmentHash)
        )
      );

    const withdraw$ = (note: string, address: string) =>
      lucid$.pipe(
        first(),
        switchMap((lucid) => '')
      );

    return {
      deposit$,
      withdraw$,
    };
  })
);
