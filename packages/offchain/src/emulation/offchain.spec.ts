import { Lucid, Emulator, generatePrivateKey, Provider } from 'lucid-cardano';
import { jest } from '@jest/globals';

import { hash, hashConcat, toHex } from '@mixer/crypto';

import { deployPool, deposit, withdraw } from '../transactions';
import { printLedger } from '../utils';

const mainMnemonicPhrase =
  'edge shadow topple brush online kid quit north muffin donate accident endorse other grant sleep';
const recipientMnemonicPhrase =
  'nut borrow depart parade aerobic pause equal produce secret avocado wild clump advance just safe slot cat forward luggage brother surround drive goose book';
const treeHeight = 7;
const zeroValue = 'tornado.cash on cardano';

describe('offchain', () => {
  it('deploy pool', async () => {
    const [lucid, emulator] = await prepareEmulator();
    await deployPool(
      lucid,
      BigInt(100000000),
      treeHeight,
      zeroValue,
      'Tree',
      'Vault',
      'Nullifiers'
    );
    emulator.awaitBlock(1);

    expect(printLedger(emulator.ledger)).toMatchSnapshot('deployment ledger');
  });

  it('deposit', async () => {
    const [lucid, emulator] = await prepareEmulator();
    const poolInfo = await deployPool(
      lucid,
      BigInt(100000000),
      treeHeight,
      zeroValue,
      'Tree',
      'Vault',
      'Nullifiers'
    );
    emulator.awaitBlock(1);

    const commitmentHash = hash('commitment');
    await deposit(lucid, poolInfo, commitmentHash);

    emulator.awaitBlock(1);

    expect(printLedger(emulator.ledger)).toMatchSnapshot('deposit ledger');
  });

  it('double deposit', async () => {
    const [lucid, emulator] = await prepareEmulator();
    const poolInfo = await deployPool(
      lucid,
      BigInt(100000000),
      treeHeight,
      zeroValue,
      'Tree',
      'Vault',
      'Nullifiers'
    );
    emulator.awaitBlock(1);

    await deposit(lucid, poolInfo, hash('commitment1'));

    emulator.awaitBlock(1);

    await deposit(lucid, poolInfo, hash('commitment2'));

    emulator.awaitBlock(1);

    expect(printLedger(emulator.ledger)).toMatchSnapshot(
      'double deposit ledger'
    );
  });

  it('withdraw', async () => {
    const [lucid, emulator] = await prepareEmulator();
    const poolInfo = await deployPool(
      lucid,
      BigInt(100000000),
      treeHeight,
      zeroValue,
      'Tree',
      'Vault',
      'Nullifiers'
    );
    emulator.awaitBlock(1);
    const nullifier1 = hash('nullifier 1').slice(0, 31);
    const secret1 = hash('secret 1').slice(0, 31);
    const commitmentHash1 = hashConcat(nullifier1, secret1);
    await deposit(lucid, poolInfo, commitmentHash1);
    emulator.awaitBlock(1);

    const recipientAddress = await getAddress(recipientMnemonicPhrase);
    await withdraw(
      lucid,
      poolInfo,
      recipientAddress,
      BigInt(2000000),
      toHex(nullifier1)
    );
    emulator.awaitBlock(1);

    expect(printLedger(emulator.ledger)).toMatchSnapshot('withdraw ledger');
  });

  it('double withdraw', async () => {
    const [lucid, emulator] = await prepareEmulator();
    const poolInfo = await deployPool(
      lucid,
      BigInt(100000000),
      treeHeight,
      zeroValue,
      'Tree',
      'Vault',
      'Nullifiers'
    );
    emulator.awaitBlock(1);
    const nullifier1 = hash('nullifier 1').slice(0, 31);
    const secret1 = hash('secret 1').slice(0, 31);
    const commitmentHash1 = hashConcat(nullifier1, secret1);
    await deposit(lucid, poolInfo, commitmentHash1);
    emulator.awaitBlock(1);

    const recipientAddress = await getAddress(recipientMnemonicPhrase);
    await withdraw(
      lucid,
      poolInfo,
      recipientAddress,
      BigInt(2000000),
      toHex(nullifier1.slice(0, 31))
    );
    emulator.awaitBlock(1);

    const spy = jest.fn();
    try {
      await withdraw(
        lucid,
        poolInfo,
        recipientAddress,
        BigInt(2000000),
        toHex(nullifier1.slice(0, 31))
      );
      emulator.awaitBlock(1);
    } catch (error) {
      spy(error);
    }

    expect(spy).toBeCalled();
  });

  it('withdraw with wrong signature', async () => {
    const [lucid, emulator] = await prepareEmulator();
    const poolInfo = await deployPool(
      lucid,
      BigInt(100000000),
      treeHeight,
      zeroValue,
      'Tree',
      'Vault',
      'Nullifiers'
    );
    emulator.awaitBlock(1);

    const nullifier1 = hash('nullifier 1').slice(0, 31);
    const secret1 = hash('secret 1').slice(0, 31);
    const commitmentHash1 = hashConcat(nullifier1, secret1);
    await deposit(lucid, poolInfo, commitmentHash1);
    emulator.awaitBlock(1);

    const spy = jest.fn();
    try {
      const fakeLucid = await mkLucid();
      await withdraw(
        fakeLucid,
        poolInfo,
        await fakeLucid.wallet.address(),
        BigInt(2000000),
        toHex(nullifier1.slice(0, 31))
      );
      emulator.awaitBlock(1);
    } catch (error) {
      spy(error);
    }

    expect(spy).toBeCalled();
  });
});

async function prepareEmulator(): Promise<[Lucid, Emulator]> {
  const address = await getAddress(mainMnemonicPhrase);
  const emulator = new Emulator([
    { address, assets: { lovelace: 3000000000n } },
  ]);

  const lucid = await mkLucid(mainMnemonicPhrase, emulator);
  return [lucid, emulator];
}

async function mkLucid(seed?: string, provider?: Provider) {
  const lucid = await Lucid.new(provider, 'Custom');
  return seed
    ? lucid.selectWalletFromSeed(seed)
    : lucid.selectWalletFromPrivateKey(generatePrivateKey());
}

async function getAddress(seed?: string) {
  const lucid = await mkLucid(seed);
  return lucid.wallet.address();
}
