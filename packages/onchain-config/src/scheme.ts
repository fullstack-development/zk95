import { Data } from 'lucid-cardano';

const MerkleTreeConfig = Data.Object({
  height: Data.Integer(),
  zeroHash: Data.Bytes(),
});

export const MixerConfig = Data.Object({
  protocolPolicyId: Data.Bytes(),
  protocolTokenName: Data.Bytes(),
  poolNominal: Data.Integer(),
  merkleTreeConfig: MerkleTreeConfig,
});
