import {
  Lucid,
  Data,
  type Assets,
  sha256,
  toHex,
  Blockfrost,
  Constr,
} from 'lucid-cardano';
import { createMixerValidator } from './createMixerValidator.ts';
import { createMintingPolicy } from './createMintingPolicy.ts';
import { MerkleTree } from './scheme.ts';
import { makeEmptyMerkleTree } from './utils.ts';

const mnemonicPhrase = Deno.env.get('MNEMONIC_PHRASE') ?? '';
const providerUrl = Deno.env.get('PROVIDER_URL') ?? '';
const providerApiKey = Deno.env.get('PROVIDER_API_KEY') ?? '';

deployPool(100, 7, 'tornado.cash on cardano', 'Protocol Token');

async function deployPool(
  nominal: number,
  treeHeight: number,
  zeroValue: string,
  protocolTokenName: string
) {
  const lucid = await Lucid.new(
    new Blockfrost(providerUrl, providerApiKey),
    'Preview'
  ).then((lucid) => lucid.selectWalletFromSeed(mnemonicPhrase));

  console.log(await lucid.wallet.getUtxos());

  const {
    script: mintingPolicyScript,
    policyId,
    tokenName,
  } = await createMintingPolicy(lucid, protocolTokenName);
  const { script: mixerValidator, address: mixerAddress } =
    createMixerValidator(
      lucid,
      policyId,
      tokenName,
      BigInt(nominal),
      BigInt(treeHeight),
      zeroValue
    );
  const protocolTokenUnit = policyId + tokenName;
  const protocolTokenAsset: Assets = { [protocolTokenUnit]: BigInt(1) };

  const zeroHash = sha256(new TextEncoder().encode(zeroValue));
  const emptyMerkleTreeRoot = makeEmptyMerkleTree(treeHeight, zeroHash);

  const merkleTree: MerkleTree = {
    root: BigInt(`0x${toHex(emptyMerkleTreeRoot.slice(1))}`),
    leafs: [],
  };

  const tx = await lucid
    .newTx()
    .attachMintingPolicy(mintingPolicyScript)
    .mintAssets(protocolTokenAsset, Data.void())
    .payToContract(
      mixerAddress,
      {
        inline: Data.to(merkleTree, MerkleTree as any),
      },
      protocolTokenAsset
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

  const poolInfo = JSON.stringify(
    {
      txHash,
      nominal,
      protocolTokenUnit,
      zeroValue,
      mixerScript: mixerValidator,
    },
    null,
    2
  );

  await Deno.writeTextFile(`${nominal}-config.json`, poolInfo);
}
