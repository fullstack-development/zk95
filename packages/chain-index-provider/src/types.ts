import { Observable } from 'rxjs';

export type TxStatuses = Record<string, boolean>;

export type CostModel = Record<string, number>;

export type CostModels = Record<PlutusVersion, CostModel>;

export type PlutusVersion = 'PlutusV2' | 'PlutusV1';

export type ProtocolParameters = {
  minFeeA: number;
  minFeeB: number;
  maxTxSize: number;
  maxValSize: number;
  keyDeposit: bigint;
  poolDeposit: bigint;
  priceMem: number;
  priceStep: number;
  maxTxExMem: bigint;
  maxTxExSteps: bigint;
  coinsPerUtxoByte: bigint;
  collateralPercentage: number;
  maxCollateralInputs: number;
  costModels: CostModels;
};

export type UTxO = {
  txHash: string;
  outputIndex: number;
  assets: Assets;
  address: string;
  datumHash?: string | null;
  datum?: string | null; // inline datum in bytes
  scriptRef?: Script | null;
};

export type Assets = Record<string, bigint>;

export type Script = {
  type: PlutusVersion | 'Native';
  script: string;
};

export type ChainIndexProvider = {
  getProtocolParameters: () => Promise<ProtocolParameters>;
  getTxsInfo: (txHashes: string[]) => Promise<TxStatuses>;
  getUTxOs: (address: string) => Promise<UTxO[]>;
  getDatum: (datumHash: string) => Promise<string>;
  submitTx: (tx: string) => Promise<string>;
};
