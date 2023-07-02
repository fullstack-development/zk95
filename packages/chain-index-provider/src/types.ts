import { Provider } from 'lucid-cardano';

export type TxStatuses = Record<string, boolean>;

export type ChainIndexProvider = Provider & {
  getTxsInfo: (txHashes: string[]) => Promise<TxStatuses>;
};
