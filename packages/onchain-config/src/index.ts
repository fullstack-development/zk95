import type { Script } from '@mixer/chain-index-provider';

export type PoolSize = number;

export type PoolConfig = {
  script: Script;
  tokenUnit: string;
  addressWithScriptRef: string;
};

export type OnchainConfig = Record<PoolSize, PoolConfig>;
export const ONCHAIN_CONFIG_KEY = 'onchainConfig';
