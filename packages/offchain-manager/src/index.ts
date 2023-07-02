import {
  combineLatest,
  first,
  map,
  shareReplay,
  switchMap,
  Observable,
  from,
} from 'rxjs';
import { Blockfrost, Data, Lucid, TxHash } from 'lucid-cardano';

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
  getPoolConfig: (nominal: string) => PoolInfo;
  getPoolTree$: (poolSize: string) => Observable<MerkleTree>;
  deposit$: (
    poolSize: string,
    commitmentHash: Uint8Array
  ) => Observable<TxHash>;
};

export const mkOffchainManager = injectable(
  token(POOLS_CONFIG_KEY)<Record<string, PoolInfo>>(),
  mkWalletModel,
  combineEff((poolsConfig, walletModel): Offchain => {
    const lucid$ = combineLatest([
      from(
        Lucid.new(
          new Blockfrost(
            process.env['NX_PROVIDER_URL'] ?? '',
            process.env['NX_PROVIDER_API_KEY']
          ),
          'Custom'
        )
      ).pipe(shareReplay(1)),
      walletModel.wallet$,
    ]).pipe(
      map(([lucid, wallet]) =>
        wallet ? lucid.selectWallet(wallet.api) : lucid
      )
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

    const getPoolConfig = (nominal: string) => {
      assert('Could not find pool config', poolsConfig[nominal]);
      return poolsConfig[nominal];
    };

    return {
      getPoolConfig,
      getPoolTree$: (nominal) =>
        lucid$.pipe(first(), switchMap(getPoolTree(nominal))),
      deposit$: (nominal, commitmentHash) =>
        lucid$.pipe(
          first(),
          switchMap((lucid) => {
            assert('Could not find pool config', poolsConfig[nominal]);
            return deposit(lucid, getPoolConfig(nominal), commitmentHash);
          })
        ),
    };
  })
);
