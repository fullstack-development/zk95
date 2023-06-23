import type { Script } from '@mixer/chain-index-provider';

export type PoolSize = number;

export type PoolConfig = {
  zeroValue: string;
  depositScript: Script;
  withdrawScript: Script;
  vaultTokenUnit: string;
  depositTreeTokenUnit: string;
  nullifierStoreTokenUnit: string;
};

export type OnchainConfig = Record<PoolSize, PoolConfig>;
export const ONCHAIN_CONFIG_KEY = 'onchainConfig';
