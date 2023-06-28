import { Script, Unit } from 'lucid-cardano';

export type PoolInfo = {
  txHash: string;
  nominal: number;
  treeTokenUnit: Unit;
  vaultTokenUnit: Unit;
  zeroValue: string;
  treeHeight: number;
  mixerScript: Script;
};
