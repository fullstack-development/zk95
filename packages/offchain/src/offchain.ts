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
import { injectable } from '@mixer/injectable';
import { combineEff } from '@mixer/eff';
import { mkWalletModel } from '@mixer/wallet';

import { mkProviderAdapter } from './provider/adapter';
import { deposit } from './transactions/deposit';

export type Offchain = {
  deposit$: (
    poolSize: number,
    commitmentHash: Uint8Array
  ) => Observable<TxHash>;
  withdraw$: (note: string, address: string) => Observable<TxHash>;
};

export const mkOffchain = injectable(
  mkWalletModel,
  chainIndexProvider,
  combineEff((walletModel, provider): Offchain => {
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
        switchMap((lucid) => '') //deposit(lucid, poolSize, commitmentHash)
      );

    const withdraw$ = (note: string, address: string) =>
      lucid$.pipe(
        first(),
        switchMap((lucid) => withdraw(lucid, note, address))
      );

    async function withdraw(lucid: Lucid, note: string, address: string) {
      return '';
    }

    return {
      deposit$,
      withdraw$,
    };
  })
);
