import express from 'express';
import cors from 'cors';
import z, { string } from 'zod';
import { groth16 } from 'snarkjs';

import { MixerDatum, PoolInfo, withdraw } from '@mixer/offchain';
import verificationKey from './verification_key.json' assert { type: 'json' };
import { Blockfrost, Data, Lucid } from 'lucid-cardano';
import { assert } from '@mixer/utils';
import {
  fromBigInt,
  fromHex,
  reverseBitsOrder,
  toBigInt,
  toHex,
} from '@mixer/crypto';

const HOST = process.env.HOST ?? 'localhost';
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MNEMONIC = process.env.MNEMONIC_PHRASE ?? '';
const PROVIDER_URL = process.env.PROVIDER_URL ?? '';
const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY ?? '';

type WithdrawRequestBody = z.output<typeof WithdrawRequestBody>;
const WithdrawRequestBody = z.object({
  fullProof: z.object({
    proof: z.object({}).passthrough(),
    publicSignals: z.tuple([
      z.string(),
      z.string(),
      z.string(),
      z.string(),
      z.string(),
    ]),
  }),
  poolInfo: z
    .object({
      address: z.string(),
      treeTokenUnit: z.string(),
      nullifiersTokenUnit: z.string(),
      vaultTokenUnit: z.string(),
      nominal: string(),
    })
    .refine(
      (
        v
      ): v is Pick<
        PoolInfo,
        | 'address'
        | 'vaultTokenUnit'
        | 'nullifiersTokenUnit'
        | 'treeTokenUnit'
        | 'nominal'
      > => !!v
    ),
});

const lucid = (
  await Lucid.new(new Blockfrost(PROVIDER_URL, PROVIDER_API_KEY), 'Preprod')
).selectWalletFromSeed(MNEMONIC);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/withdraw', async (req, res, next) => {
  try {
    const { fullProof, poolInfo } = WithdrawRequestBody.parse(req.body);
    const [circuitRoot, circuitNullifierHash, circuitRecipient, , circuitFee] =
      fullProof.publicSignals;

    const { address, treeTokenUnit } = poolInfo;
    const scriptUtxos = await lucid.utxosAt(address);

    const treeUtxo = scriptUtxos.find(
      (utxo) => utxo.assets[treeTokenUnit] === 1n
    );

    assert('Could not find utxo with merkle tree', treeUtxo);
    assert('Could not find datum with merkle tree', treeUtxo.datum);

    const mixerDatum = Data.from<MixerDatum>(
      treeUtxo.datum,
      MixerDatum as never
    );

    assert(
      'Wrong datum structure',
      mixerDatum !== 'Vault' && 'Tree' in mixerDatum
    );

    const currentRoot = toBigInt(
      reverseBitsOrder(fromHex(mixerDatum.Tree[0].root).slice(0, 31))
    ).toString();

    assert('Wrong root hash', circuitRoot === currentRoot);

    const recipientPkh = toHex(fromBigInt(BigInt(circuitRecipient)));

    const recipientAddress = lucid.utils.credentialToAddress({
      type: 'Key',
      hash: recipientPkh,
    });

    const verification = groth16.verify(
      verificationKey,
      fullProof.publicSignals,
      fullProof.proof
    );

    assert('Proof is not valid', verification);

    const nullifierHashHex = toHex(fromBigInt(BigInt(circuitNullifierHash)));

    const txHash = await withdraw(
      lucid,
      poolInfo,
      recipientAddress,
      BigInt(circuitFee),
      nullifierHashHex
    );

    res.json(txHash);
  } catch (error) {
    next((error as Error).message);
  }
});

app.get('/ping', (req, res) => {
  res.send();
});

app.listen(PORT, HOST, () => {
  console.log(`listening on ${HOST}:${PORT}`);
});
