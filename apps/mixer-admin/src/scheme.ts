import { Data } from 'lucid-cardano';

export const MerkleTreeConfig = Data.Object({
  height: Data.Integer(),
  zeroHash: Data.Bytes(),
});

export type MixerConfig = Data.Static<typeof MixerConfig>;
export const MixerConfig = Data.Object({
  protocolPolicyId: Data.Bytes(),
  protocolTokenName: Data.Bytes(),
  poolNominal: Data.Integer(),
  merkleTreeConfig: MerkleTreeConfig,
});

export type MerkleTree = Data.Static<typeof MerkleTree>;
export const MerkleTree = Data.Object({
  root: Data.Integer(),
  leafs: Data.Array(Data.Bytes()),
});
