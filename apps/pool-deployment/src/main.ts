import { Lucid, Blockfrost } from 'lucid-cardano';
import fs from 'node:fs';

import { deployPool } from '@mixer/offchain';

const MNEMONIC = process.env.MNEMONIC_PHRASE ?? '';
const PROVIDER_URL = process.env.PROVIDER_URL ?? '';
const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY ?? '';

const NOMINAL = BigInt(200_000_000);
const TREE_HEIGHT = 7;
const ZERO_VALUE = 'tornado.cash on cardano';

const lucid = await Lucid.new(
  new Blockfrost(PROVIDER_URL, PROVIDER_API_KEY),
  'Preprod'
).then((lucid) => lucid.selectWalletFromSeed(MNEMONIC));

const poolInfo = await deployPool(
  lucid,
  NOMINAL,
  TREE_HEIGHT,
  ZERO_VALUE,
  'Tree',
  'Vault',
  'Nullifiers'
);

if (!fs.existsSync('pools')) {
  fs.mkdirSync('pools');
}

fs.writeFileSync(
  `pools/ada-${lucid.network}-${poolInfo.nominal}.json`,
  JSON.stringify(poolInfo, null, 2)
);
