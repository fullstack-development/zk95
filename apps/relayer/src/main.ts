import z, { string } from 'zod';
import snarkjs from 'snarkjs';
import express from 'express';

import { PoolInfo, withdraw } from '@mixer/offchain';
import verificationKey from './verification_key.json' assert { type: 'json' };

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

type WithdrawRequestBody = z.output<typeof WithdrawRequestBody>;
const WithdrawRequestBody = z.object({
  proof: z.object({}),
  poolInfo: z
    .object({
      address: z.string(),
      vaultTokenUnit: z.string(),
      nullifiersTokenUnit: z.string(),
      nominal: string(),
    })
    .refine(
      (
        v
      ): v is Pick<
        PoolInfo,
        'address' | 'vaultTokenUnit' | 'nullifiersTokenUnit' | 'nominal'
      > => !!v
    ),
});

app.post('/withdraw', async (req, res) => {
  const { proof, poolInfo } = WithdrawRequestBody.parse(req.body);

  res.json({ message: 'Hello API' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
