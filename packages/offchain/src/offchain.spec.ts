import { Emulator, Lucid } from 'lucid-cardano';
import { deployPool } from './transactions/deploy-pool';

const mnemonicPhrase =
  'edge shadow topple brush online kid quit north muffin donate accident endorse other grant sleep';
const treeHeight = 7;
const zeroValue = 'tornado.cash on cardano';

describe('offchain', () => {
  describe('deploy deposit transaction', () => {
    it('', async () => {
      const address = await (await Lucid.new(undefined, 'Custom'))
        .selectWalletFromSeed(mnemonicPhrase)
        .wallet.address();

      const emulator = new Emulator([
        { address, assets: { lovelace: 3000000000n } },
      ]);

      const lucid = await Lucid.new(emulator);

      lucid.selectWalletFromSeed(mnemonicPhrase);

      await deployPool(lucid, 100, treeHeight, zeroValue, 'Tree', 'Vault');

      await emulator.awaitBlock(1);

      console.log(await emulator.ledger);
    });
  });
});
