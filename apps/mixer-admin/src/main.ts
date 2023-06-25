import { Lucid, Blockfrost } from 'lucid-cardano';

import { deployPool } from './transactions/deploy-pool/index.ts';

const mnemonicPhrase = Deno.env.get('MNEMONIC_PHRASE') ?? '';
const providerUrl = Deno.env.get('PROVIDER_URL') ?? '';
const providerApiKey = Deno.env.get('PROVIDER_API_KEY') ?? '';

const lucid = await Lucid.new(
  new Blockfrost(providerUrl, providerApiKey),
  'Preview'
).then((lucid) => lucid.selectWalletFromSeed(mnemonicPhrase));

const poolInfo = await deployPool(
  lucid,
  100,
  7,
  'tornado.cash on cardano',
  'Tree',
  'Vault'
);

await Deno.writeTextFile(
  `ada-${poolInfo.nominal}-config.json`,
  JSON.stringify(poolInfo, null, 2)
);
