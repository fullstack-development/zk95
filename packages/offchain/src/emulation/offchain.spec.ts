import { Lucid, Emulator } from 'lucid-cardano';
import { deployPool, deposit } from '../transactions';
import { hash } from '@mixer/crypto';

const mnemonicPhrase =
  'edge shadow topple brush online kid quit north muffin donate accident endorse other grant sleep';
const treeHeight = 7;
const zeroValue = 'tornado.cash on cardano';

async function prepareEmulator(): Promise<[Lucid, Emulator]> {
  const address = await (await Lucid.new(undefined, 'Custom'))
    .selectWalletFromSeed(mnemonicPhrase)
    .wallet.address();

  const emulator = new Emulator([
    { address, assets: { lovelace: 3000000000n } },
  ]);

  const lucid = await Lucid.new(emulator);
  lucid.selectWalletFromSeed(mnemonicPhrase);
  return [lucid, emulator];
}

describe('offchain', () => {
  it('deploy pool transaction', async () => {
    const [lucid, emulator] = await prepareEmulator();
    await deployPool(lucid, 100, treeHeight, zeroValue, 'Tree', 'Vault');
    emulator.awaitBlock(1);

    expect(emulator.ledger).toMatchSnapshot('deployment ledger');
  });

  it('deposit transaction', async () => {
    const [lucid, emulator] = await prepareEmulator();
    const poolInfo = await deployPool(
      lucid,
      100,
      treeHeight,
      zeroValue,
      'Tree',
      'Vault'
    );
    emulator.awaitBlock(1);

    const commitmentHash = hash('commitment');
    await deposit(lucid, poolInfo, commitmentHash);

    emulator.awaitBlock(1);

    expect(emulator.ledger).toMatchSnapshot('deposit ledger');
  });
});
