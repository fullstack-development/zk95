import { Lucid, Data, Assets, toHex, fromText } from 'lucid-cardano';
import { createMixerValidator } from './create-mixer-validator';
import { createMintingPolicy } from './create-minting-policy';

import { makeMerkleTree } from '@mixer/merkletree';
import { MintRedeemer, MixerDatum } from '../../scheme';
import { PoolInfo } from '../../types';
import { assert } from '@mixer/utils';

export async function deployPool(
  lucid: Lucid,
  nominal: bigint,
  treeHeight: number,
  zeroValue: string,
  treeTokenName: string,
  vaultTokenName: string,
  nullifiersTokenName: string
): Promise<PoolInfo> {
  const { script: mintingPolicyScript, policyId } = await createMintingPolicy(
    lucid
  );

  const ownAddress = await lucid.wallet.address();
  const paymentCredential =
    lucid.utils.getAddressDetails(ownAddress).paymentCredential;

  assert('Could not get payment key hash', paymentCredential?.type === 'Key');

  const { script: mixerValidator, address: mixerAddress } =
    createMixerValidator(
      lucid,
      policyId,
      fromText(treeTokenName),
      fromText(nullifiersTokenName),
      fromText(vaultTokenName),
      paymentCredential.hash,
      nominal,
      BigInt(treeHeight),
      zeroValue
    );

  const treeTokenUnit = policyId + fromText(treeTokenName);
  const vaultTokenUnit = policyId + fromText(vaultTokenName);
  const nullifiersTokenUnit = policyId + fromText(nullifiersTokenName);
  const mixerAsset: Assets = {
    [treeTokenUnit]: BigInt(1),
    [vaultTokenUnit]: BigInt(1),
    [nullifiersTokenUnit]: BigInt(1),
  };

  const emptyMerkleTree = makeMerkleTree({
    height: treeHeight,
    leafs: [],
    zeroValue,
  });

  const treeDatum = Data.to<MixerDatum>(
    {
      Tree: [
        {
          root: toHex(emptyMerkleTree.root.slice(1)),
          leafs: [],
        },
      ],
    },
    MixerDatum as never
  );

  const nullifiersDatum = Data.to<MixerDatum>(
    {
      Nullifiers: [[]],
    },
    MixerDatum as never
  );

  const vaultDatum = Data.to<MixerDatum>('Vault', MixerDatum as never);

  const mintRedeemer = Data.to<MintRedeemer>(
    [
      fromText(treeTokenName),
      fromText(vaultTokenName),
      fromText(nullifiersTokenName),
    ],
    MintRedeemer as never
  );

  const tx = await lucid
    .newTx()
    .attachMintingPolicy(mintingPolicyScript)
    .mintAssets(mixerAsset, mintRedeemer)
    .payToContract(
      mixerAddress,
      {
        inline: treeDatum,
      },
      {
        [treeTokenUnit]: BigInt(1),
        lovelace: BigInt(2000000),
      }
    )
    .payToContract(
      mixerAddress,
      {
        inline: nullifiersDatum,
      },
      {
        [nullifiersTokenUnit]: BigInt(1),
        lovelace: BigInt(2000000),
      }
    )
    .payToContract(
      mixerAddress,
      {
        inline: vaultDatum,
      },
      { [vaultTokenUnit]: BigInt(1) }
    )
    .payToAddressWithData(
      mixerAddress,
      {
        scriptRef: mixerValidator,
      },
      {}
    )
    .complete();

  const signedTx = await tx.sign().complete();

  const txHash = await signedTx.submit();

  return {
    txHash,
    network: lucid.network,
    nominal: nominal.toString(),
    treeHeight,
    treeTokenUnit,
    vaultTokenUnit,
    nullifiersTokenUnit,
    zeroValue,
    address: mixerAddress,
    script: mixerValidator,
  };
}
