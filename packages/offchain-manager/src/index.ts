import {
  combineLatest,
  first,
  map,
  shareReplay,
  switchMap,
  Observable,
  from,
} from 'rxjs';
import { Data, Lucid, TxHash } from 'lucid-cardano';

import { mkChainIndexProvider } from '@mixer/chain-index-provider';
import { injectable, token } from '@mixer/injectable';
import { combineEff } from '@mixer/eff';
import { mkWalletModel } from '@mixer/wallet';
import {
  PoolInfo,
  POOLS_CONFIG_KEY,
  deposit,
  MixerDatum,
} from '@mixer/offchain';
import { MerkleTree, makeMerkleTree } from '@mixer/merkletree';

import { mkProviderAdapter } from './provider/adapter';
import { assert } from '@mixer/utils';

export type Offchain = {
  getPoolTree$: (poolSize: number) => Observable<MerkleTree>;
  deposit$: (
    poolSize: number,
    commitmentHash: Uint8Array
  ) => Observable<TxHash>;
};

export const mkOffchainManager = injectable(
  token(POOLS_CONFIG_KEY)<Record<number, PoolInfo>>(),
  mkWalletModel,
  mkChainIndexProvider,
  combineEff((poolsConfig, walletModel, provider): Offchain => {
    const lucidProvider = mkProviderAdapter(provider);

    const lucid$ = combineLatest([
      from(Lucid.new(lucidProvider, 'Preprod')).pipe(shareReplay(1)),
      walletModel.wallet$,
    ]).pipe(
      map(([lucid, wallet]) =>
        wallet ? lucid.selectWallet(wallet.api) : lucid
      )
    );

    const getPoolTree = (poolSize: number) => async (lucid: Lucid) => {
      const config = poolsConfig[poolSize];
      assert("Couldn't find pool config", config);

      const poolUTxOs = await lucid.utxosAt(config.address);
      const treeUTxO = poolUTxOs.find(
        (utxo) => utxo.assets[config.treeTokenUnit] === BigInt(1)
      );

      assert("Couldn't find UTxO with merkle tree", treeUTxO);
      assert("Couldn't find merkle tree datum", treeUTxO.datum);

      const parsedDatum = Data.from<MixerDatum>(
        treeUTxO.datum,
        MixerDatum as never
      );

      assert('Wrong datum', parsedDatum !== 'Vault');

      return makeMerkleTree({
        leafs: parsedDatum.Tree[0].leafs,
        height: config.treeHeight,
        zeroValue: config.zeroValue,
      });
    };

    return {
      getPoolTree$: (poolSize) =>
        lucid$.pipe(first(), switchMap(getPoolTree(poolSize))),
      deposit$: (poolSize, commitmentHash) =>
        lucid$.pipe(
          first(),
          switchMap((lucid) =>
            deposit(lucid, poolsConfig[poolSize], commitmentHash)
          )
        ),
    };
  })
);
