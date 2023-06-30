import { Lucid, Data, Assets, toHex, fromText } from 'lucid-cardano';
import { createMixerValidator } from './create-mixer-validator';
import { createMintingPolicy } from './create-minting-policy';

import { makeMerkleTree } from '@mixer/merkletree';
import { MintRedeemer, MixerDatum } from '../../scheme';
import { PoolInfo } from '../../types';

export async function deployPool(
  lucid: Lucid,
  nominal: number,
  treeHeight: number,
  zeroValue: string,
  treeTokenName: string,
  vaultTokenName: string
): Promise<PoolInfo> {
  console.info('creating token minting policy...');
  const { script: mintingPolicyScript, policyId } = await createMintingPolicy(
    lucid
  );
  console.info(
    `tree minting policy is created successfully with policy id: ${policyId}`
  );

  console.info('creating deposit script...');
  const { script: mixerValidator, address: mixerAddress } =
    createMixerValidator(
      lucid,
      policyId,
      fromText(treeTokenName),
      fromText(vaultTokenName),
      BigInt(nominal),
      BigInt(treeHeight),
      zeroValue
    );
  console.info(
    `deposit script is created successfully with address: ${mixerAddress}`
  );

  console.info('data preparation...');
  const treeTokenUnit = policyId + fromText(treeTokenName);
  const vaultTokenUnit = policyId + fromText(vaultTokenName);
  const mixerAsset: Assets = {
    [treeTokenUnit]: BigInt(1),
    [vaultTokenUnit]: BigInt(1),
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

  const vaultDatum = Data.to<MixerDatum>('Vault', MixerDatum as never);

  const mintRedeemer = Data.to<MintRedeemer>(
    [fromText(treeTokenName), fromText(vaultTokenName)],
    MintRedeemer as never
  );

  console.group('transaction');
  console.info('creating transaction...');
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
        lovelace: BigInt(10000000),
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
  console.info('transaction has been created');

  console.info('signing transaction...');
  const signedTx = await tx.sign().complete();
  console.info('transaction has been signed');

  console.info('submitting tx...');
  const txHash = await signedTx.submit();
  console.info(`transaction has been submitted with tx hash: ${txHash}`);
  console.groupEnd();

  return {
    txHash,
    nominal,
    treeHeight,
    treeTokenUnit,
    vaultTokenUnit,
    zeroValue,
    address: mixerAddress,
    script: mixerValidator,
  };
}
