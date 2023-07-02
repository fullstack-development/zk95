import {
  applyParamsToScript,
  sha256,
  toHex,
  type Script,
  type Address,
  type Lucid,
  Constr,
} from 'lucid-cardano';

import { readValidator } from '../../utils';

export function createMixerValidator(
  lucid: Lucid,
  policyId: string,
  treeTokenNameHash: string,
  nullifiersTokenNameHash: string,
  vaultTokenNameHash: string,
  relayerPkh: string,
  nominal: bigint,
  treeHeight: bigint,
  zeroValue: string
): { script: Script; address: Address } {
  const makeMixerValidator = readValidator('mixer.mixer_validator');
  const zeroHashHex = toHex(sha256(new TextEncoder().encode(zeroValue)));

  const mixerConfig = new Constr(0, [
    policyId,
    treeTokenNameHash,
    vaultTokenNameHash,
    nullifiersTokenNameHash,
    nominal,
    relayerPkh,
    new Constr(0, [treeHeight, zeroHashHex]),
  ]);

  const mixerValidator = applyParamsToScript(makeMixerValidator.script, [
    mixerConfig,
  ]);

  const script: Script = {
    type: 'PlutusV2',
    script: mixerValidator,
  };

  return {
    script,
    address: lucid.utils.validatorToAddress(script),
  };
}
