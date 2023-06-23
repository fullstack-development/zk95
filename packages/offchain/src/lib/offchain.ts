import {
  combineLatest,
  first,
  map,
  shareReplay,
  switchMap,
  Observable,
} from 'rxjs';
import { Lucid, Address, Data, TxHash, toHex, addAssets } from 'lucid-cardano';

import { ONCHAIN_CONFIG_KEY, OnchainConfig } from '@mixer/onchain-config';
import { chainIndexProvider } from '@mixer/chain-index-provider';
import { injectable, token } from '@mixer/injectable';
import { combineEff } from '@mixer/eff';
import { mkWalletModel } from '@mixer/wallet';
import { Script } from '@mixer/chain-index-provider';
import { assert } from '@mixer/utils';

import { MixerDatum, MixerRedeemer } from './scheme';
import { deserializeMerkleTree, serializeMerkleTree } from './utils';
import { mkProviderAdapter } from './providerAdapter';
import { reverseBits } from '@mixer/hash';

export type Offchain = {
  deposit$: (
    poolSize: number,
    commitmentHash: Uint8Array
  ) => Observable<TxHash>;
  withdraw$: (note: string, address: string) => Observable<TxHash>;
};

export const mkOffchain = injectable(
  token(ONCHAIN_CONFIG_KEY)<OnchainConfig>(),
  mkWalletModel,
  chainIndexProvider,
  combineEff((onchainConfig, walletModel, provider): Offchain => {
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
        switchMap((lucid) => deposit(lucid, poolSize, commitmentHash))
      );

    const withdraw$ = (note: string, address: string) =>
      lucid$.pipe(
        first(),
        switchMap((lucid) => withdraw(lucid, note, address))
      );

    async function deposit(
      lucid: Lucid,
      poolSize: number,
      commitmentHash: Uint8Array
    ) {
      const config = onchainConfig[poolSize];

      assert(`Pool with ${poolSize} nominal not found`, config);

      const depositScriptAddress: Address = lucid.utils.validatorToAddress(
        config.depositScript
      );

      const depositUTxOs = await lucid.utxosAt(depositScriptAddress);

      const utxoWithScriptRef = depositUTxOs.find(
        ({ scriptRef }) =>
          scriptRef && toAddress(lucid, scriptRef) === depositScriptAddress
      );

      assert(
        `Cannot find a utxo with the deposit referece script`,
        utxoWithScriptRef
      );

      const vaultUTxO = depositUTxOs.find(
        ({ assets }) => assets[config.vaultTokenUnit] !== undefined
      );

      assert(`Cannot find a utxo with the vault`, vaultUTxO);
      assert(`Cannot find a vault datum`, vaultUTxO.datum);

      const merkleTreeUTxO = depositUTxOs.find(
        ({ assets }) => assets[config.depositTreeTokenUnit] !== undefined
      );

      assert(`Cannot find a utxo with the merkle tree`, merkleTreeUTxO);
      assert(`Merkle tree datum is missing`, merkleTreeUTxO.datum);

      const inputDatum = Data.from(
        merkleTreeUTxO.datum,
        MixerDatum as never as MixerDatum
      );

      console.log({
        datum: merkleTreeUTxO.datum,
        commitment: toHex(commitmentHash),
      });

      assert('Wrong merkle tree datum', inputDatum !== 'Vault');

      const merkleTree = deserializeMerkleTree(
        config.zeroValue,
        inputDatum.DepositTree.DepositDatum.merkleTreeState.tree
      );

      assert('Pool is full', !merkleTree.completed);

      const nextMerkleTree = merkleTree.addLeaf(commitmentHash, false);

      console.log({
        merkleTree,
        nextMerkleTree,
      });

      const serializedRoot = toHex(
        reverseBits(nextMerkleTree.root.hash, 0, 31)
      );

      const outputDatum: MixerDatum = {
        DepositTree: {
          DepositDatum: {
            merkleTreeRoot: {
              Just: [BigInt(`0x${serializedRoot}`)],
            },
            merkleTreeState: {
              nextLeaf: BigInt(
                nextMerkleTree.completed
                  ? nextMerkleTree.leafsCount
                  : nextMerkleTree.nextIdx
              ),
              tree: serializeMerkleTree(nextMerkleTree),
            },
          },
        },
      };

      const depositRedeemer: MixerRedeemer = {
        Deposit: [toHex(commitmentHash)],
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

    async function withdraw(lucid: Lucid, note: string, address: string) {
      const datumIn =
        'd8799fd8799fd8799f00d87a9f5820c70db3a37303100f9c9654c50a0f1028c3adf55bd413e29177078617d19d4e63d87a9f582032a7b13eff6836a40fd4f2b9e1da47de280f371b0ff3ef361828e0d88814a7f9d87980d87980ffd87a9f582032a7b13eff6836a40fd4f2b9e1da47de280f371b0ff3ef361828e0d88814a7f9d87980d87980ffffffd87a80ffff';
      const commitmentHashHex =
        'af3a62ef64a383b4f07041bb2b086b1789815ffbbf7e4bac9f59adb641f921ce';
      const userAddress = await lucid.wallet.address();
      const config = onchainConfig[100];

      const inputDatum = Data.from(datumIn, MixerDatum as never as MixerDatum);

      assert('Wrong merkle tree datum', inputDatum !== 'Vault');

      const merkleTree = deserializeMerkleTree(
        config.zeroValue,
        inputDatum.DepositTree.DepositDatum.merkleTreeState.tree
      );

      assert('Pool is full', !merkleTree.completed);

      const nextMerkleTree = merkleTree.addLeaf(commitmentHashHex, false);

      const serializedRoot = `0x${toHex(
        nextMerkleTree.root.hash.slice(0, 31)
      )}`;

      const outputDatum: MixerDatum = {
        DepositTree: {
          DepositDatum: {
            merkleTreeRoot: {
              Just: [BigInt(serializedRoot)],
            },
            merkleTreeState: {
              nextLeaf: BigInt(
                nextMerkleTree.completed
                  ? nextMerkleTree.leafsCount
                  : nextMerkleTree.nextIdx
              ),
              tree: serializeMerkleTree(nextMerkleTree),
            },
          },
        },
      };

      const depositRedeemer: MixerRedeemer = {
        Deposit: [commitmentHashHex],
      };

      const tx = await lucid
        .newTx()
        .payToAddressWithData(
          userAddress,
          {
            inline: Data.to<MixerRedeemer>(
              depositRedeemer,
              MixerRedeemer as never
            ),
          },
          { lovelace: BigInt(2000000) }
        )
        .complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      return txHash;
    }

    function toAddress(lucid: Lucid, script: Script) {
      return lucid.utils.validatorToAddress(script);
    }

    return {
      deposit$,
      withdraw$,
    };
  })
);
