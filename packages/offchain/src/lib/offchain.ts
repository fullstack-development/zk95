import {
  combineLatest,
  first,
  map,
  shareReplay,
  switchMap,
  Observable,
} from 'rxjs';
import {
  Lucid,
  Address,
  Data,
  TxHash,
  Blockfrost,
  toHex,
  addAssets,
} from 'lucid-cardano';

import { ONCHAIN_CONFIG_KEY, OnchainConfig } from '@mixer/onchain-config';
import { injectable, token } from '@mixer/injectable';
import { combineEff } from '@mixer/eff';
import { mkWalletModel } from '@mixer/wallet';
import { Script } from '@mixer/chain-index-provider';
import { toHexTree } from '@mixer/merkletree';
import { traceIf } from '@mixer/utils';

import { MixerDatum, MixerRedeemer } from './scheme';
import { deserializeMerkleTree, serializeMerkleTree } from './utils';

export type Offchain = {
  deposit$: (poolSize: number, commitmentHash: string) => Observable<TxHash>;
  withdraw$: () => void;
};

export const mkOffchain = injectable(
  token(ONCHAIN_CONFIG_KEY)<OnchainConfig>(),
  mkWalletModel,
  combineEff((onchainConfig, walletModel): Offchain => {
    const provider = new Blockfrost(
      'https://cardano-preprod.blockfrost.io/api/v0',
      'preprodZpZ9X9GL1xL5vajWd8VNxHxcTyYoMePJ'
    );

    const lucid$ = combineLatest([
      Lucid.new(provider, 'Preprod'),
      walletModel.wallet$,
    ]).pipe(
      map(([lucid, wallet]) =>
        wallet ? lucid.selectWallet(wallet.api) : lucid
      ),
      shareReplay(1)
    );

    const zeroValue = 'tornado.cash on cardano';

    const deposit$ = (poolSize: number, commitmentHash: string) =>
      lucid$.pipe(
        first(),
        switchMap((lucid) =>
          deposit(
            lucid,
            poolSize,
            'a6412338645d14a7782c4ef186ae0deae1d3efb6c140b62bb8a5f1238cdcd93f'
          )
        )
      );

    const withdraw$ = () => {
      //
    };

    async function deposit(
      lucid: Lucid,
      poolSize: number,
      commitmentHash: string
    ) {
      const config = onchainConfig[poolSize];

      traceIf(`Pool with ${poolSize} nominal not found`, config);

      const depositScriptAddress: Address = lucid.utils.validatorToAddress({
        type: config.depositScript.type,
        script: config.depositScript.cbor,
      });

      const depositUTxOs = await lucid.utxosAt(depositScriptAddress);

      const utxoWithScriptRef = depositUTxOs.find(
        ({ scriptRef }) =>
          scriptRef &&
          toAddress(lucid, { type: scriptRef.type, cbor: scriptRef.script }) ===
            depositScriptAddress
      );

      traceIf(
        `Cannot find a utxo with the deposit referece script`,
        utxoWithScriptRef
      );

      const vaultUTxO = depositUTxOs.find(
        ({ assets }) => assets[config.vaultTokenUnit] !== undefined
      );

      traceIf(`Cannot find a utxo with the vault`, vaultUTxO);
      traceIf(`Cannot find a vault datum`, vaultUTxO.datum);

      const merkleTreeUTxO = depositUTxOs.find(
        ({ assets }) => assets[config.depositTreeTokenUnit] !== undefined
      );

      traceIf(`Cannot find a utxo with the merkle tree`, merkleTreeUTxO);
      traceIf(`Merkle tree datum is missing`, merkleTreeUTxO.datum);

      const inputDatum = Data.from(
        merkleTreeUTxO.datum,
        MixerDatum as never as MixerDatum
      );

      traceIf('Wrong merkle tree datum', inputDatum !== 'Vault');

      const merkleTree = deserializeMerkleTree(
        zeroValue,
        inputDatum.DepositTree.DepositDatum.merkleTreeState.tree
      );

      traceIf('Pool is full', !merkleTree.completed);

      const nextMerkleTree = merkleTree.addLeaf(commitmentHash, false);

      const serializedMerkleTree = serializeMerkleTree(nextMerkleTree);

      const outputDatum: MixerDatum = {
        DepositTree: {
          DepositDatum: {
            merkleTreeRoot: BigInt(`0x${toHex(nextMerkleTree.root.hash)}`),
            merkleTreeState: {
              nextLeaf: BigInt(1),
              tree: serializedMerkleTree,
            },
          },
        },
      };

      const depositRedeemer: MixerRedeemer = {
        Deposit: [commitmentHash],
      };

      const vaultRedeemer: MixerRedeemer = 'Topup';

      const tx = await lucid
        .newTx()
        .readFrom([utxoWithScriptRef])
        .collectFrom(
          [merkleTreeUTxO],
          Data.to<MixerRedeemer>(depositRedeemer, MixerRedeemer as never)
        )
        .payToContract(
          depositScriptAddress,
          { inline: Data.to<MixerDatum>(outputDatum, MixerDatum as never) },
          merkleTreeUTxO.assets
        )
        .collectFrom(
          [vaultUTxO],
          Data.to<MixerRedeemer>(vaultRedeemer, MixerRedeemer as never)
        )
        .payToContract(
          depositScriptAddress,
          { inline: vaultUTxO.datum },
          addAssets(vaultUTxO.assets, {
            lovelace: BigInt(poolSize) * BigInt(1000000),
          })
        )
        .complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();
      return txHash;
    }

    function toAddress(lucid: Lucid, script: Script) {
      return lucid.utils.validatorToAddress({
        type: script.type,
        script: script.cbor,
      });
    }

    return {
      deposit$,
      withdraw$,
    };
  })
);
