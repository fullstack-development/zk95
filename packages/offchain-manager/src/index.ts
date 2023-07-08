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
  withdraw,
} from '@mixer/offchain';
import { MerkleTree, makeMerkleTree } from '@mixer/merkletree';
import { assert } from '@mixer/utils';
import { type Proof, mkProofGenerator } from '@mixer/proof-generator';
import {
  fromBigInt,
  fromHex,
  reverseBitsOrder,
  toBigInt,
  toHex,
} from '@mixer/crypto';

export type Offchain = {
  getPoolConfig: (nominal: string) => PoolInfo;
  getPoolTree$: (nominal: string) => Observable<MerkleTree>;
  deposit$: (nominal: string, commitmentHash: Uint8Array) => Observable<TxHash>;
  withdraw$: (nominal: string, proof: Proof) => Promise<TxHash>;
};

export const mkOffchainManager = injectable(
  token(POOLS_CONFIG_KEY)<Record<string, PoolInfo>>(),
  mkWalletModel,
  mkProofGenerator,
  combineEff((poolsConfig, walletModel, { verify }): Offchain => {
    const provider = new Blockfrost(
      process.env['NX_PROVIDER_URL'] ?? '',
      process.env['NX_PROVIDER_API_KEY']
    );

    const lucid$ = combineLatest([
      from(Lucid.new(provider, 'Preprod')).pipe(shareReplay(1)),
      walletModel.wallet$,
    ]).pipe(
      map(([lucid, wallet]) =>
        wallet ? lucid.selectWallet(wallet.api) : lucid
      )
    );

    const getPoolTree = (nominal: string) => async (lucid: Lucid) => {
      const config = poolsConfig[nominal];
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

    const withdraw$ = async (nominal: string, proof: Proof) => {
      const config = getPoolConfig(nominal);

      const relayerLucid = (
        await Lucid.new(provider, 'Preprod')
      ).selectWalletFromSeed(process.env.NX_RELAYER_MNEMONIC ?? '');

      const [
        circuitRoot,
        circuitNullifierHash,
        circuitRecipient,
        ,
        circuitFee,
      ] = proof.publicSignals;

      const { address, treeTokenUnit } = config;
      const scriptUtxos = await relayerLucid.utxosAt(address);

      const treeUtxo = scriptUtxos.find(
        (utxo) => utxo.assets[treeTokenUnit] === 1n
      );

      assert('Could not find utxo with merkle tree', treeUtxo);
      assert('Could not find datum with merkle tree', treeUtxo.datum);

      const mixerDatum = Data.from<MixerDatum>(
        treeUtxo.datum,
        MixerDatum as never
      );

      assert(
        'Wrong datum structure',
        mixerDatum !== 'Vault' && 'Tree' in mixerDatum
      );

      const currentRoot = toBigInt(
        reverseBitsOrder(fromHex(mixerDatum.Tree[0].root).slice(0, 31))
      ).toString();

      assert('Wrong root hash', circuitRoot === currentRoot);

      const recipientPkh = toHex(fromBigInt(BigInt(circuitRecipient)));

      const recipientAddress = relayerLucid.utils.credentialToAddress({
        type: 'Key',
        hash: recipientPkh,
      });

      const verification = await verify(proof);

      assert('Proof is not valid', verification);

      const nullifierHashHex = toHex(fromBigInt(BigInt(circuitNullifierHash)));

      return withdraw(
        relayerLucid,
        config,
        recipientAddress,
        BigInt(circuitFee),
        nullifierHashHex
      );
    };

    return {
      getPoolConfig,
      getPoolTree$: (nominal) =>
        lucid$.pipe(first(), switchMap(getPoolTree(nominal))),
      withdraw$,
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
