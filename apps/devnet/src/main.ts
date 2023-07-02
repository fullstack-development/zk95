import fs from 'node:fs';
import { Emulator, Lucid, getAddressDetails } from 'lucid-cardano';
import cors from 'cors';
import express from 'express';

import { deployPool } from '@mixer/offchain';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const mainMnemonicPhrase =
  'edge shadow topple brush online kid quit north muffin donate accident endorse other grant sleep';

const emptyLucid = await Lucid.new(undefined, 'Custom');
const mainAddress = await emptyLucid
  .selectWalletFromSeed(mainMnemonicPhrase)
  .wallet.address();

const emulator = new Emulator([
  {
    address: mainAddress,
    assets: { lovelace: 10000_000_000n },
  },
]);

await setupDevnet();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/protocol-parameters', async (req, res, next) => {
  try {
    const params = await emulator.getProtocolParameters();
    res.json(serialize(params));
  } catch (error) {
    next(error);
  }
});

app.get('/utxos/address/:address', async (req, res) => {
  const address = JSON.parse(req.params.address);
  const utxos = await emulator.getUtxos(address);

  res.json(serialize(utxos));
});

app.get('/utxos/unit/:unit', async (req, res) => {
  const { unit } = req.params;
  const utxo = await emulator.getUtxoByUnit(unit);
  res.json(serialize(utxo));
});

app.get('/utxos/:address/unit/:unit', async (req, res) => {
  const { address, unit } = req.params;
  const utxos = await emulator.getUtxosWithUnit(JSON.parse(address), unit);
  res.json(serialize(utxos));
});

app.get('/utxos/refs/:outRefs', async (req, res) => {
  const { outRefs } = req.params;
  const utxos = await emulator.getUtxosByOutRef(JSON.parse(outRefs));
  res.json(serialize(utxos));
});

app.get('/delegation/:address', async (req, res) => {
  const { address } = req.params;
  const delegation = await emulator.getDelegation(address);
  res.json(serialize(delegation));
});

app.get('/datum/:hash', async (req, res) => {
  const { hash } = req.params;
  const datum = await emulator.getDatum(hash);
  res.json(datum);
});

app.post('/await', async (req, res, next) => {
  try {
    const { txHashes = [] } = req.body as { txHashes: string[] };
    const txStatuses = await Promise.all(
      txHashes.map((txHash) => emulator.awaitTx(txHash))
    );
    const verified = txStatuses.reduce<Record<string, boolean>>(
      (acc, status, idx) => {
        acc[txHashes[idx]] = status;
        return acc;
      },
      {}
    );

    res.json(verified);
  } catch (error) {
    next(error);
  }
});

app.post('/submit', async (req, res, next) => {
  try {
    const { tx } = req.body;
    const txHash = await emulator.submitTx(tx);
    emulator.awaitBlock(1);
    res.json(txHash);
  } catch (error) {
    next(error);
  }
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

async function setupDevnet() {
  const poolsNominals = [
    100_000_000n,
    200_000_000n,
    300_000_000n,
    400_000_000n,
  ];
  const lucid = (await Lucid.new(emulator, 'Custom')).selectWalletFromSeed(
    mainMnemonicPhrase
  );

  for (const nominal of poolsNominals) {
    const poolInfo = await deployPool(
      lucid,
      nominal,
      7,
      'zero value',
      'Tree',
      'Vault',
      'Nullifiers'
    );
    emulator.awaitBlock(1);

    if (!fs.existsSync('pools')) {
      fs.mkdirSync('pools');
    }

    fs.writeFileSync(
      `pools/ada-${lucid.network}-${poolInfo.nominal}.json`,
      JSON.stringify(poolInfo, null, 2)
    );
  }
}

const serialize = (data: unknown) =>
  JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() + 'n' : value
  );
