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

import { assert } from '@mixer/utils';

export type Offchain = {
  getPoolTree$: (poolSize: string) => Observable<MerkleTree>;
  deposit$: (
    poolSize: string,
    commitmentHash: Uint8Array
  ) => Observable<TxHash>;
};

const mainMnemonicPhrase =
  'edge shadow topple brush online kid quit north muffin donate accident endorse other grant sleep';

export const mkOffchainManager = injectable(
  token(POOLS_CONFIG_KEY)<Record<string, PoolInfo>>(),
  mkWalletModel,
  mkChainIndexProvider,
  combineEff((poolsConfig, walletModel, provider): Offchain => {
    // const lucidProvider = mkProviderAdapter(provider);

    const lucid$ = combineLatest([
      from(Lucid.new(provider, 'Custom')).pipe(shareReplay(1)),
      walletModel.wallet$,
    ]).pipe(
      map(([lucid, wallet]) => lucid.selectWalletFromSeed(mainMnemonicPhrase))
    );

    const getPoolTree = (poolSize: string) => async (lucid: Lucid) => {
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

      assert('Wrong datum', parsedDatum !== 'Vault' && 'Tree' in parsedDatum);

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
