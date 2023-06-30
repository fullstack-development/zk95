import { Address, Data, Lucid, addAssets, toHex } from 'lucid-cardano';
import { makeMerkleTree } from '@mixer/merkletree';
import { assert } from '@mixer/utils';
import { MixerDatum, MixerRedeemer } from '../scheme';
import { PoolInfo } from '../types';

export async function deposit(
  lucid: Lucid,
  {
    script,
    treeTokenUnit,
    vaultTokenUnit,
    nominal,
    treeHeight,
    zeroValue,
  }: PoolInfo,

  commitmentHash: Uint8Array
) {
  const depositScriptAddress: Address = lucid.utils.validatorToAddress(script);

  const depositUTxOs = await lucid.utxosAt(depositScriptAddress);

  const utxoWithScriptRef = depositUTxOs.find(
    ({ scriptRef }) =>
      scriptRef &&
      lucid.utils.validatorToAddress(scriptRef) === depositScriptAddress
  );

  assert(
    `Cannot find a utxo with the deposit reference script`,
    utxoWithScriptRef
  );

  const vaultUTxO = depositUTxOs.find(
    ({ assets }) => assets[vaultTokenUnit] !== undefined
  );

  assert(`Cannot find a utxo with the vault`, vaultUTxO);
  assert(`Cannot find a vault datum`, vaultUTxO.datum);

  const merkleTreeUTxO = depositUTxOs.find(
    ({ assets }) => assets[treeTokenUnit] !== undefined
  );

  assert(`Cannot find a utxo with the merkle tree`, merkleTreeUTxO);
  assert(`Merkle tree datum is missing`, merkleTreeUTxO.datum);

  const redeemer = Data.to<MixerRedeemer>(
    {
      Deposit: [toHex(commitmentHash)],
    },
    MixerRedeemer as never
  );

  const inputDatum = Data.from<MixerDatum>(
    merkleTreeUTxO.datum,
    MixerDatum as never
  );

  assert(`Wrong datum in the merkle tree utxo`, inputDatum !== 'Vault');

  const merkleTree = makeMerkleTree({
    height: treeHeight,
    leafs: inputDatum.Tree[0].leafs,
    zeroValue,
  });

  assert('Pool is full', !merkleTree.completed);

  const nextMerkleTree = merkleTree.insert(commitmentHash);

  const outputDatum = Data.to<MixerDatum>(
    {
      Tree: [
        {
          root: toHex(nextMerkleTree.root.slice(1)),
          leafs: nextMerkleTree.leafs.map(toHex),
        },
      ],
    },
    MixerDatum as never
  );

  const tx = await lucid
    .newTx()
    .readFrom([utxoWithScriptRef])
    .collectFrom([merkleTreeUTxO], redeemer)
    .payToContract(
      depositScriptAddress,
      { inline: outputDatum },
      merkleTreeUTxO.assets
    )
    .collectFrom([vaultUTxO], redeemer)
    .payToContract(
      depositScriptAddress,
      { inline: vaultUTxO.datum },
      addAssets(vaultUTxO.assets, {
        lovelace: BigInt(nominal) * BigInt(1000000),
      })
    )
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  return txHash;
}
