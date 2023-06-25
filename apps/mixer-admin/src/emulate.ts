import { Emulator, Lucid, Blockfrost, sha256, toHex } from 'lucid-cardano';
import { deployPool } from './transactions/deploy-pool/index.ts';
import { deposit } from './transactions/deposit.ts';

const mnemonicPhrase = Deno.env.get('MNEMONIC_PHRASE') ?? '';
const providerUrl = Deno.env.get('PROVIDER_URL') ?? '';
const providerApiKey = Deno.env.get('PROVIDER_API_KEY') ?? '';
const blockfrost = new Blockfrost(providerUrl, providerApiKey);

const protocolParameters = await blockfrost.getProtocolParameters();

const treeHeight = 2;
const zeroValue = 'tornado.cash on cardano';

const address = await (await Lucid.new(undefined, 'Custom'))
  .selectWalletFromSeed(mnemonicPhrase)
  .wallet.address();

const emulator = new Emulator(
  [{ address, assets: { lovelace: 3000000000n } }],
  protocolParameters
);

const lucid = await Lucid.new(emulator);

lucid.selectWalletFromSeed(mnemonicPhrase);

const { mixerScript, treeTokenUnit, vaultTokenUnit, nominal } =
  await deployPool(lucid, 100, treeHeight, zeroValue, 'Tree', 'Vault');

await emulator.awaitBlock(1);

console.log(await emulator.ledger);

const commitment1 = sha256(new TextEncoder().encode('commitment1'));

await deposit(
  lucid,
  mixerScript,
  treeTokenUnit,
  vaultTokenUnit,
  nominal,
  treeHeight,
  zeroValue,
  commitment1
);

await emulator.awaitBlock(1);

// const commitment2 = sha256(new TextEncoder().encode('commitment2'));
// await deposit(
//   lucid,
//   mixerScript,
//   treeTokenUnit,
//   vaultTokenUnit,
//   nominal,
//   commitment2
// );

// await emulator.awaitBlock(1);

console.log(await emulator.ledger);
