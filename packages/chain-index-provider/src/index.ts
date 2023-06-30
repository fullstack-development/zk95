import { injectable } from '@mixer/injectable';
import { mkKoiosProvider } from './koios-provider';
import type { ChainIndexProvider } from './types';

export * from './types';
export const CHAIN_INDEX_PROVIDE_KEY = 'chainIndexProvider';
export const mkChainIndexProvider = injectable(
  CHAIN_INDEX_PROVIDE_KEY,
  (): ChainIndexProvider => mkKoiosProvider('https://preprod.koios.rest/api/v0')
);
