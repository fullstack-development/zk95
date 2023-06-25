import { Data } from 'lucid-cardano';

export const MerkleTreeConfig = Data.Object({
  height: Data.Integer(),
  zeroHash: Data.Bytes(),
});

export type MixerConfig = Data.Static<typeof MixerConfig>;
export const MixerConfig = Data.Object({
  policyId: Data.Bytes(),
  treeTokenName: Data.Bytes(),
  vaultTokenName: Data.Bytes(),
  poolNominal: Data.Integer(),
  merkleTreeConfig: MerkleTreeConfig,
});

export type MerkleTree = Data.Static<typeof MerkleTree>;
export const MerkleTree = Data.Object({
  root: Data.Bytes(),
  leafs: Data.Array(Data.Bytes()),
});

export type MixerDatum = Data.Static<typeof MixerDatum>;
export const MixerDatum = Data.Enum([
  Data.Object({
    Tree: Data.Tuple([MerkleTree]),
  }),
  Data.Literal('Vault'),
]);

export type MintRedeemer = Data.Static<typeof MintRedeemer>;
export const MintRedeemer = Data.Array(Data.Bytes());

export type Redeemer = Data.Static<typeof Redeemer>;
export const Redeemer = Data.Enum([
  Data.Object({
    Deposit: Data.Tuple([Data.Bytes()]),
  }),
  Data.Literal('Withdraw'),
]);
