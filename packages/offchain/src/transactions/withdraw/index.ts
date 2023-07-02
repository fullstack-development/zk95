import { Address, Data, Lucid, addAssets, toHex } from 'lucid-cardano';
import { assert } from '@mixer/utils';
import { MixerDatum, MixerRedeemer } from '../../scheme';
import { PoolInfo } from '../../types';

export async function withdraw(
  lucid: Lucid,
  {
    address,
    vaultTokenUnit,
    nullifiersTokenUnit,
    nominal,
  }: Pick<
    PoolInfo,
    'address' | 'vaultTokenUnit' | 'nullifiersTokenUnit' | 'nominal'
  >,
  recipient: Address,
  feeLovelace: bigint,
  nullifier: Uint8Array
) {
  const depositUTxOs = await lucid.utxosAt(address);

  const utxoWithScriptRef = depositUTxOs.find(
    ({ scriptRef }) =>
      scriptRef && lucid.utils.validatorToAddress(scriptRef) === address
  );

  assert(
    `Cannot find a utxo with the deposit reference script`,
    utxoWithScriptRef
  );

  const vaultUTxO = depositUTxOs.find(
    ({ assets }) => assets[vaultTokenUnit] === BigInt(1)
  );

  assert(`Cannot find a utxo with the vault`, vaultUTxO);
  assert(`Cannot find a vault datum`, vaultUTxO.datum);

  const nullifiersUTxO = depositUTxOs.find(
    ({ assets }) => assets[nullifiersTokenUnit] === BigInt(1)
  );

  assert(`Cannot find a utxo with the nullifiers`, nullifiersUTxO);
  assert(`Nullifiers datum is missing`, nullifiersUTxO.datum);

  const redeemer = Data.to<MixerRedeemer>(
    {
      Withdraw: [toHex(nullifier)],
    },
    MixerRedeemer as never
  );

  const inputDatum = Data.from<MixerDatum>(
    nullifiersUTxO.datum,
    MixerDatum as never
  );

  assert(`Wrong datum`, inputDatum !== 'Vault' && 'Nullifiers' in inputDatum);

  const outputDatum = Data.to<MixerDatum>(
    {
      Nullifiers: [inputDatum.Nullifiers[0].concat([toHex(nullifier)])],
    },
    MixerDatum as never
  );

  const ownAddress = await lucid.wallet.address();

  const tx = await lucid
    .newTx()
    .readFrom([utxoWithScriptRef])
    .collectFrom([nullifiersUTxO], redeemer)
    .payToContract(address, { inline: outputDatum }, nullifiersUTxO.assets)
    .collectFrom([vaultUTxO], redeemer)
    .payToContract(
      address,
      { inline: vaultUTxO.datum },
      addAssets(vaultUTxO.assets, {
        lovelace: -BigInt(nominal),
      })
    )
    .payToAddress(recipient, {
      lovelace: BigInt(nominal) - feeLovelace,
    })
    .addSigner(ownAddress)
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  return txHash;
}
