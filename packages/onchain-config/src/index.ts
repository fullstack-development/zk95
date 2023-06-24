import { type Script, Data } from 'lucid-cardano';

export type PoolSize = number;

export type PoolConfig = {
  zeroValue: string;
  depositScript: Script;
  withdrawScript: Script;
  vaultTokenUnit: string;
  depositTreeTokenUnit: string;
  nullifierStoreTokenUnit: string;
};

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

export type MixerConfig = Data.Static<typeof MixerConfig>;

export type OnchainConfig = Record<PoolSize, PoolConfig>;
export const ONCHAIN_CONFIG_KEY = 'onchainConfig';
