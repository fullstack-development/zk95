import { z } from 'zod';
import type {
  ProtocolParameters,
  Assets,
  PlutusVersion,
  CostModels,
  UTxO,
  TxStatuses,
} from '../types';

export const ChainTip = z
  .array(
    z.object({
      epoch_no: z.number(),
    })
  )
  .transform(([tip]) => ({
    epoch: tip.epoch_no,
  }));

export type ChainTip = z.output<typeof ChainTip>;

export const ProtocolParametersResponse = z
  .array(
    z.object({
      min_fee_a: z.number(),
      min_fee_b: z.number(),
      max_tx_size: z.number(),
      max_val_size: z.number(),
      key_deposit: z.string().transform((v) => BigInt(v)),
      pool_deposit: z.string().transform((v) => BigInt(v)),
      price_mem: z.number(),
      price_step: z.number(),
      max_tx_ex_mem: z.number().transform((v) => BigInt(v)),
      max_tx_ex_steps: z.number().transform((v) => BigInt(v)),
      collateral_percent: z.number(),
      coins_per_utxo_size: z.string().transform((v) => BigInt(v)),
      max_collateral_inputs: z.number(),
      cost_models: z.string().transform((str) => JSON.parse(str) as CostModels),
    })
  )
  .transform(([params]): ProtocolParameters => {
    return {
      minFeeA: params.min_fee_a,
      minFeeB: params.min_fee_b,
      maxTxSize: params.max_tx_size,
      maxValSize: params.max_val_size,
      keyDeposit: params.key_deposit,
      poolDeposit: params.pool_deposit,
      priceMem: params.price_mem,
      priceStep: params.price_step,
      maxTxExMem: params.max_tx_ex_mem * BigInt(15),
      maxTxExSteps: params.max_tx_ex_steps * BigInt(15),
      coinsPerUtxoByte: params.coins_per_utxo_size,
      collateralPercentage: params.collateral_percent,
      maxCollateralInputs: params.max_collateral_inputs,
      costModels: params.cost_models,
    };
  });

export const UTxOSet = z.array(
  z
    .object({
      asset_list: z
        .array(
          z.object({
            asset_name: z.string(),
            policy_id: z.string(),
            quantity: z.string().transform((v) => BigInt(v)),
          })
        )
        .transform((list) =>
          list.reduce<Assets>((acc, { asset_name, policy_id, quantity }) => {
            acc[policy_id + asset_name] = quantity;
            return acc;
          }, {})
        ),
      block_height: z.number(),
      block_time: z.number(),
      datum_hash: z.string().nullable(),
      inline_datum: z
        .object({
          bytes: z.string(),
        })
        .nullable(),
      reference_script: z
        .object({
          bytes: z.string(),
          hash: z.string(),
          size: z.number(),
          type: z
            .enum(['plutusV2', 'plutusV1', 'native'])
            .transform((t) => capitalize(t) as PlutusVersion),
          value: z.unknown().nullable(),
        })
        .nullable(),
      tx_hash: z.string(),
      tx_index: z.number(),
      value: z.string().transform((v) => BigInt(v)),
    })
    .transform(
      ({
        tx_hash,
        tx_index,
        asset_list,
        value,
        datum_hash,
        reference_script,
        inline_datum,
      }) => {
        asset_list['lovelace'] = value;
        return {
          txHash: tx_hash,
          outputIndex: tx_index,
          assets: asset_list,
          datumHash: datum_hash,
          scriptRef: reference_script
            ? {
                type: reference_script.type,
                script: reference_script.bytes,
              }
            : null,
          datum: inline_datum?.bytes ?? null,
        };
      }
    )
);

export const GetUTxOsResponse = z
  .array(
    z.object({
      address: z.string(),
      balance: z.string().transform((v) => BigInt(v)),
      script_address: z.boolean(),
      stake_address: z.string().nullable(),
      utxo_set: UTxOSet,
    })
  )
  .transform(([{ address, utxo_set }]): UTxO[] =>
    utxo_set.map((utxo) => ({ ...utxo, address }))
  );

export const DatumResponse = z
  .array(
    z.object({
      hash: z.string(),
      value: z.unknown(),
      bytes: z.string(),
    })
  )
  .transform(([{ bytes }]) => bytes);

export const TxStatusResponse = z
  .array(
    z.object({
      tx_hash: z.string(),
      num_confirmations: z.number().nullable(),
    })
  )
  .transform(
    (statuses): TxStatuses =>
      statuses.reduce<TxStatuses>((acc, { tx_hash, num_confirmations }) => {
        acc[tx_hash] = num_confirmations !== null;
        return acc;
      }, {})
  );

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
