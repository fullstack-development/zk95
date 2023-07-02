import { Script, applyDoubleCborEncoding, Network } from 'lucid-cardano';
import z from 'zod';

const networks = ['Custom', 'Mainnet', 'Preprod', 'Preview'];

export const PoolInfo = z.object({
  network: z.string().refine((v): v is Network => networks.includes(v)),
  txHash: z.string(),
  nominal: z.string(),
  treeTokenUnit: z.string(),
  vaultTokenUnit: z.string(),
  nullifiersTokenUnit: z.string(),
  zeroValue: z.string(),
  treeHeight: z.number(),
  address: z.string(),
  script: z
    .object({
      type: z
        .literal('PlutusV1')
        .or(z.literal('PlutusV2'))
        .or(z.literal('Native')),
      script: z.string().transform(applyDoubleCborEncoding),
    })
    .refine<Script>((script): script is Script => true),
});

export type PoolInfo = z.output<typeof PoolInfo>;
