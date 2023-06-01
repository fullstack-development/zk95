import { z } from 'zod';

import { Address, CostModels, Credential, Provider, UTxO } from 'lucid-cardano';

const ChainTip = z
  .array(
    z.object({
      epoch_no: z.number(),
    })
  )
  .transform(([tip]) => ({
    epoch: tip.epoch_no,
  }));

type ChainTip = z.output<typeof ChainTip>;

const ProtocolParameters = z
  .array(
    z.object({
      min_fee_a: z.number(),
      min_fee_b: z.number(),
      max_tx_size: z.number(),
      max_val_size: z.number(),
      key_deposit: z.bigint(),
      pool_deposit: z.bigint(),
      price_mem: z.number(),
      price_step: z.number(),
      max_tx_ex_mem: z.bigint(),
      max_tx_ex_steps: z.bigint(),
      collateral_percent: z.number(),
      coins_per_utxo_size: z.bigint(),
      max_collateral_inputs: z.number(),
      cost_models: z.string().transform((str) => JSON.parse(str) as CostModels),
    })
  )
  .transform(([params]) => {
    return {
      minFeeA: params.min_fee_a,
      minFeeB: params.min_fee_b,
      maxTxSize: params.max_tx_size,
      maxValSize: params.max_val_size,
      keyDeposit: params.key_deposit,
      poolDeposit: params.pool_deposit,
      priceMem: params.price_mem,
      priceStep: params.price_step,
      maxTxExMem: params.max_tx_ex_mem,
      maxTxExSteps: params.max_tx_ex_steps,
      coinsPerUtxoByte: params.coins_per_utxo_size,
      collateralPercentage: params.collateral_percent,
      maxCollateralInputs: params.max_collateral_inputs,
      costModels: params.cost_models,
    };
  });

type ProtocolParameters = z.output<typeof ProtocolParameters>;

export function mkKoiosProvider(url: string): Provider {
  return {
    getProtocolParameters: () =>
      fetch(`${url}/tip`)
        .then((response) => response.json())
        .then((response) => ChainTip.parse(response))
        .then(({ epoch }) => fetch(`${url}/epoch_params?_epoch_no=${epoch}`))
        .then((response) => response.json())
        .then((response) => ProtocolParameters.parse(response)),

    getUtxos: (addressOrCredential: Address | Credential): Promise<UTxO[]> => {
      return fetch(`${url}/address_info`).then();
    },
    /** Query UTxOs by address or payment credential filtered by a specific unit. */
    getUtxosWithUnit: (
      addressOrCredential: Address | Credential,
      unit: Unit
    ): Promise<UTxO[]> => {},
    /** Query a UTxO by a unit. It needs to be an NFT (or optionally the entire supply in one UTxO). */
    getUtxoByUnit: (unit) => {},
    /** Query UTxOs by the output reference (tx hash and index). */
    getUtxosByOutRef: (outRefs) => {},
    getDelegation: (rewardAddress) => {},
    getDatum: (datumHash) => {},
    awaitTx: (txHash, checkInterval) => {},
    submitTx: (tx) => {},
  };
}
